const host = process.env.SERVER_HOST || 'localhost';
const menu = `
<html>
<head>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">

  <link href="/i/layout.css" rel="stylesheet">
  <link href="/i/pagination.css" rel="stylesheet">
  <link href="/i/upload.css" rel="stylesheet">

  <script    src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.1/socket.io.slim.js"></script>
  <script src="https://code.jquery.com/jquery-2.2.0.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
  <script src="/i/bootstrap-notify.min.js"></script>
</head>
<body>

<script>
	var socket = io.connect('http://${host}:3050');
	
  socket.on('changed', function (what) {
    if (what.type === 'notice') {
      $.notify(what.message);
    }
  });
	
</script>

<pre id="errors" style="display:none">
  <a href="/delete-error-log" class="btn btn-danger">Очистить</a>
  <div class="cont"></div>
</pre>
<script>
  $.ajax({
    url: '/get-error-log',
    success: function(result) {
      if (!result) return;
      $("#errors .cont").html(result);
      $("#errors").css('display', 'block');
    }
  });
</script>

<nav class="navbar navbar-default" role="navigation">
  <div class="container-fluid">
    <!-- Brand and toggle get grouped for better mobile display -->
    <div class="navbar-header">
      <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
      <a class="navbar-brand" href="/">Avito Parse'n'Call</a>
    </div>
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav">
        <li class="dropdown">
          <a href="№" class="dropdown-toggle" data-toggle="dropdown">Выдачи <b class="caret"></b></a>
          <ul class="dropdown-menu">
          
            <li><a href="/sources">Посмотреть</a></li>
            <li><a href="/add-source">Добавить выдачу</a></li>
          </ul>
        </li> 
        <li><a href="/settings">Настройки</a><li>
        <!--
        <li class="dropdown">
          <a href="#" class="dropdown-toggle" data-toggle="dropdown">Dropdown <b class="caret"></b></a>
          <ul class="dropdown-menu">
            <li><a href="#">Действие</a></li>
            <li><a href="#">Другое действие</a></li>
            <li><a href="#">Что-то еще</a></li>
            <li class="divider"></li>
            <li><a href="#">Отдельная ссылка</a></li>
            <li class="divider"></li>
            <li><a href="#">Еще одна отдельная ссылка</a></li>
          </ul>
        </li>
        -->
      </ul>
    </div>
  </div>
</nav>
<div class="body">
`;

module.exports = menu;