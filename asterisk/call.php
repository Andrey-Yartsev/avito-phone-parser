<?php

$id = $_SERVER['argv'][1];
$phone = $_SERVER['argv'][2];

if (!$_SERVER['argv'][3]) {
  throw new Exception('source hot defined');
}
//

$t = "Channel: SIP/sipnet/$phone";
$s = <<<CALL
$t
MaxRetries: 0
WaitTime: 30
Context: common
Extension: s
Priority: 1

CALL;

$data['id'] = $id;
$data['source'] = $_SERVER['argv'][3];
foreach ($data as $k => $v) $s .= "Set: $k=$v\n";
$tmpFile = '/tmp/'.rand(10, 10000);
file_put_contents($tmpFile, $s);
chown($tmpFile, 'asterisk');
$file = '/var/spool/asterisk/outgoing/'.time().'-'.rand(100, 999).'.call';
rename($tmpFile, $file);
