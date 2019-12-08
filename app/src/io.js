import socketIO from 'socket.io';
import {User} from './types/auth';
import {getUserFromToken} from './utils/misc';

export const handleIO = (server) => {
  const io = socketIO(server);
  const onlineUserMap = () => {
    const map = {};
    Object.values(io.sockets.sockets).forEach((s) => {
      if (s.user) map[s.user.username] = true;
    });
    return map;
  };
  const findSocketsByUsername = (username) => {
    return Object.values(io.sockets.sockets).filter(s => s.user && s.user.username === username);
  };
  io.on('connection', (socket) => {
    socket.on('login', async (data) => {
      try {
        socket.token = data;
        const user: User = await getUserFromToken(data);
        socket.user = user;
        socket.emit('user', user);
        io.emit('onlineUsers', onlineUserMap());
      } catch (e) {
        console.error(e);
        socket.emit('loginExpired', {});
      }
    });
    socket.on('disconnected', () => {
      io.emit('onlineUsers', onlineUserMap());
    });
    socket.on('verifiedMessage', async (id) => {
      let user: User;
      try {
        user = await getUserFromToken(socket.token);
      } catch (e) {
        console.error(`${socket.id} not authenticated!`);
        socket.emit('loginExpired', {});
        return;
      }
      const {from, to} = JSON.parse(id);
      if (user.username !== to) {
        console.error(`${user.username} !== ${to}!`);
        return;
      }
      const senders = findSocketsByUsername(from);
      senders.forEach((s) => {
        s.emit('messageStatus', {
          id,
          type: 'VERIFIED'
        });
      });
    });
    socket.on('sendMessage', async (message) => {
      let user: User;
      try {
        user = await getUserFromToken(socket.token);
      } catch (e) {
        console.error(`${socket.id} not authenticated!`);
        socket.emit('loginExpired', {});
        return;
      }
      message.from = user.username;
      const recipients = findSocketsByUsername(message.to);
      recipients.forEach((r) => {
        // console.log('receiveMessage', r.id);
        r.emit('receiveMessage', message);
      });
      socket.emit('messageStatus', {
        id: message.id,
        type: 'SENT'
      });
      // console.log(message);
    });
    socket.on('dhKeyExchange', async (message) => {
      let user: User;
      try {
        user = await getUserFromToken(socket.token);
      } catch (e) {
        console.error(`${socket.id} not authenticated!`);
        socket.emit('loginExpired', {});
        return;
      }
      // console.log('dhKeyExchange', message);
      message.from = user.username;
      const recipients = findSocketsByUsername(message.to);
      recipients.forEach((r) => {
        r.emit('dhKeyExchange', message);
      });
    });
  });
};
