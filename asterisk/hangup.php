<?php

error_reporting(E_ALL & ~E_NOTICE);
require('phpagi.php');

$root = dirname(__DIR__);

$agi = new AGI();
$id = $agi->getVar('id');

$agi->conlog("cd $root/core && node callResult.js $id hangup");
$r = `cd $root/core && node callResult.js $id hangup`;
$agi->conlog($r);
