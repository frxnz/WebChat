var express = require('express'),
    http    = require('http'),
    app     = express(),
    server  = http.createServer(app),
    io      = require('socket.io').listen(server, { log: false }),
    port    = 3700;

app.use(express.static(__dirname + '/'));

var users = [
        {
            address : '192.168.1.145',
            name    : 'Derek'
        }
    ],
    methods = {
        getTime : function () {
            var time    = new Date(),
                hours   = time.getHours() <= 12 ? time.getHours() : Math.abs(time.getHours() - 12),
                minutes = time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes(),
                ampm    = time.getHours() <= 12 ? 'am' : 'pm';

            return hours + ':' + minutes + ampm;
        },
        getUsername : function (address) {
            var user = users.filter(function(user) {
                return user.address === address;
            });

            return user[0] ? user[0].name : 'Lone Wanderer';
        }
    },
    messages = [],
    clients  = {},
    client;

io.sockets.on('connection', function (socket) {

    client  = {
        "id"   : socket.id,
        "ip"   : socket.handshake.address.address,
        "name" : methods.getUsername(socket.handshake.address.address)
    }

    clients[socket.id] = client;

    socket.emit('user', clients);
    socket.broadcast.emit('user', clients);

    socket.emit('message', messages);

    socket.on('send', function (data) {
        var message = data.message === 'refresh' ? '<script>window.location.reload(true)</script>' : data.message.replace('/</g', '&lt;'),
            toSend = {
                username  : data.username,
                message   : message,
                timestamp : methods.getTime()
            };

        if (data.message !== 'refresh') messages.push(toSend);
        if (messages.length === 11) messages.shift();

        io.sockets.emit('message', toSend);
    });

    socket.on('disconnect', function () {
        delete clients[socket.id];
        socket.broadcast.emit('user', clients);
    });
});

server.listen(port);
console.log("Listening on port " + port);