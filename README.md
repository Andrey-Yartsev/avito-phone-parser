# Avito Parse-N-Call Serivice

Parses phones from avito and call to them

## Install

    sudo apt-get install -y tesseract-ocr
    sudo apt-get install -y asterisk
    
Install npm,  nodejs, php, mongo

    curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -

    sudo apt-get install -y nodejs

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
    fromuser = 0042319323
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

Add to `/usr/share/asterisk/agi-bin/answer.php`

```php
#!/usr/bin/php -q
<?php
require('/usr/src/avito/asterisk/answer.php');
```
Set permission `chmod 755 /usr/share/asterisk/agi-bin/answer.php`

Reload asterisk `/etc/init.d/asterisk reload`

### Clone project

    git clone https://github.com/majexa/avito /usr/src/avito

### Install `pm2`

    sudo npm install -g pm2

### Run daemon