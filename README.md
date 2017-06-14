# Avito Parse-N-Call Service

Parses phones from avito and call to them

## Install

### Soft

#### Git, Asterisk, Tesseract

    apt-get install -y git-core
    apt-get install -y asterisk
    apt-get install -y tesseract-ocr
    
#### PHP

    apt-get install -y software-properties-common
    add-apt-repository ppa:ondrej/php
    apt-get update
    apt-get install -y php5.6

#### Node.js

    curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
    apt-get install -y nodejs

#### Java, Selenium, Firefox

##### Java

    apt-get update
    apt-get install -y default-jre
    
##### Selenium

    mkdir /usr/lib/selenium
    mkdir /var/log/selenium
    wget -O /usr/lib/selenium/selenium-server-standalone.jar https://goo.gl/s4o9Vx
    
Add `/etc/init.d/selenium` script:

```bash
#!/bin/bash

case "${1:-''}" in
    'start')
        if test -f /tmp/selenium.pid
        then
            echo "Selenium is already running."
        else
            export DISPLAY=localhost:99.0
            java -jar /usr/lib/selenium/selenium-server-standalone.jar -port 4444 > /var/log/selenium/output.log 2> /var/log/selenium/error.log & echo $! > /tmp/selenium.pid
            echo "Starting Selenium..."

            error=$?
            if test $error -gt 0
            then
                echo "${bon}Error $error! Couldn't start Selenium!${boff}"
            fi
        fi
    ;;
    'stop')
        if test -f /tmp/selenium.pid
        then
            echo "Stopping Selenium..."
            PID=`cat /tmp/selenium.pid`
            kill -3 $PID
            if kill -9 $PID ;
                then
                    sleep 2
                    test -f /tmp/selenium.pid && rm -f /tmp/selenium.pid
                else
                    echo "Selenium could not be stopped..."
                fi
        else
            echo "Selenium is not running."
        fi
        ;;
    'restart')
        if test -f /tmp/selenium.pid
        then
            kill -HUP `cat /tmp/selenium.pid`
            test -f /tmp/selenium.pid && rm -f /tmp/selenium.pid
            sleep 1
            export DISPLAY=localhost:99.0
            java -jar -Dwebdriver.gecko.driver=/usr/lib/selenium/geckodriver /usr/lib/selenium/selenium-server-standalone.jar > /var/log/selenium/output.log 2> /var/log/selenium/error.log & echo $! > /tmp/selenium.pid
            echo "Reload Selenium..."
        else
            echo "Selenium isn't running..."
        fi
        ;;
    *)      # no parameter specified
        echo "Usage: $SELF start|stop|restart"
        exit 1
    ;;
esac
```

Add `/etc/init.d/selenium start` to `/etc/init.d/rc.local`

Firefox

    apt-get install -y firefox
    
Copy `./selenium` file to `/etc/init.d/selenium`
    
    chmod +x /etc/init.d/selenium

#### MongoDB

    apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
    echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list
    apt-get update
    apt-get install -y mongodb-org

Create file `/etc/systemd/system/mongodb.service` with such contents: 

    [Unit]
    Description=High-performance, schema-free document-oriented database
    After=network.target

    [Service]
    User=mongodb
    ExecStart=/usr/bin/mongod --quiet --config /etc/mongod.conf

    [Install]
    WantedBy=multi-user.target
    
Add system startup script

    systemctl enable mongodb
    
Run

    systemctl start mongodb
    
### Setup asterisk config

#### Add trunk

Add to `/etc/asterisk/users.conf`

    [sipnet]
    defaultuser = XXX
    remotesecret = XXX
    host = sipnet.ru
    type = peer
    context = common
    insecure = invite
    callbackextension = s
    fromuser = XXXXXXXXXX
    fromdomain = sipnet.ru
    disallow=all
    allow=gsm
    allow=alaw
    nat = no
    directmedia = no
    dtmfmode = rfc2833
    
Add to `/etc/asterisk/extensions.ael`

    context common {
      s => {
        AGI(answer.php);
      };
      h => {
        AGI(hangup.php);
      };
    }

Create file `/usr/share/asterisk/agi-bin/answer.php` with such contents:

```php
#!/usr/bin/php -q
<?php
require('/usr/src/collector/asterisk/answer.php');
```
Set permission `chmod 755 /usr/share/asterisk/agi-bin/answer.php`

Create file `/usr/share/asterisk/agi-bin/hangup.php` with such contents:

```php
#!/usr/bin/php -q
<?php
require('/usr/src/collector/asterisk/hangup.php');
```
Set permission `chmod 755 /usr/share/asterisk/agi-bin/hangup.php`

Reload asterisk `/etc/init.d/asterisk reload`

### Clone project and build project

    git clone https://github.com/majexa/collector /usr/src/collector
    cd /usr/src/collector/core && npm install
    
Create file `.env` with such contents:

    SERVER_HOST = IP_OF_THE_SERVER
    SMSC_LOGIN = login
    SMSC_PASSWORD = password

### Install pm2

    npm install -g pm2

### Run services

    cd /usr/src/collector/core
    pm2 start server.js
   