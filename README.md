# Avito Parse-N-Call Service

Parses phones from avito and call to them

## Install

### Soft

#### Tesseract, Asterisk, Git

    apt-get install -y tesseract-ocr
    apt-get install -y asterisk
    apt-get install -y git-core
    
#### PHP

    apt-get install -y software-properties-common
    add-apt-repository ppa:ondrej/php
    apt-get update
    apt-get install -y php5.6

#### Node.js

    curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
    sudo apt-get install -y nodejs

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
    }

Create file `/usr/share/asterisk/agi-bin/answer.php` with such contents:

```php
#!/usr/bin/php -q
<?php
require('/usr/src/collector/asterisk/answer.php');
```
Set permission `chmod 755 /usr/share/asterisk/agi-bin/answer.php`

Reload asterisk `/etc/init.d/asterisk reload`

### Clone project and build project

    git clone https://github.com/majexa/collector /usr/src/collector
    cd /usr/src/collector/core && npm install

### Install pm2

    npm install -g pm2

### Run services

    cd /usr/src/collector/core
    pm2 start server.js

    