<?php

error_reporting(E_ALL & ~E_NOTICE);
require('phpagi.php');

$agi = new AGI();
$agi->answer();
$id = $agi->getVar('id');
$r = $agi->getDigit(__DIR__.'/sound/hello');
$keys = $r['result'];
$accepted = $keys === '1' ? '1' : '0';
$root = dirname(__DIR__);
`node $root/core/callResult.js $id $accepted`;
$agi->hangup();
