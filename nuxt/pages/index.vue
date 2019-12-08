<template lang="pug">
  v-container.grid-list-xl
    v-snackbar(v-model="snackbar") {{ snackbarText }}
      v-btn(color="pink" text="" @click="snackbar = false") Close
    v-layout(wrap align-center justify-center v-if="!profile" )
      div
        p.display-3 E2E IM
        div Secure. End to end encrypted. Instant messaging.
        .dis An account will be created for you if it does not exist.
        v-form(ref='form' v-model="loginValid")
          v-text-field(v-model='username' label='Username' required prepend-icon="person"
            :rules="[(v) => !!v || 'Username required']"
          )
          v-text-field(v-model='password' label='Password' required prepend-icon="lock" type="password"
            :rules="[(v) => !!v || 'Password required', (v) => (v && v.length >= 6) || 'Password min 6 characters']"
          )
          v-btn.info.dark(@click="login" :loading="loggingIn" style="width: 100%" :disabled="!loginValid") Login
    v-layout(wrap align-center justify-center v-else-if="profile")
      v-row
        v-col(cols=12 md=3)
          v-card.mx-auto.overflow-y-auto(height='calc(100vh - 15em)' tile outlined )
            v-list
              v-subheader ONLINE USERS
              v-list-item-group(v-model='pickedUsername' color='primary')
                v-list-item(v-if='e[0] !== profile.username' v-for='e in Object.entries(conversations).sort((a, b) => a[0].localeCompare(b[0]))' :key='e[0]' :value='e[0]')
                  v-list-item-content
                    v-list-item-title @{{ e[0] }}
                    v-list-item-subtitle(
                      v-if="e[1].chatLogs.length - e[1].readCount > 0"
                    ) {{ e[1].chatLogs.length - e[1].readCount }} unread messages
                    v-list-item-subtitle(v-if="!e[1].isOnline") Currently offline
                    v-list-item-subtitle(v-if="e[1].unsent && e[0] !== recipientUsername") Draft exists
        v-col(cols=12 md=9)
          v-card.mx-auto.overflow-y-auto(height='calc(100vh - 289px)' tile outlined ref="logs")
            v-list
              v-subheader {{ chatTitle }}
              template(v-if="recipientUsername" )
                v-list-item(v-for='(item, i) in conversations[recipientUsername].chatLogs' :key='i'
                  :style="{'user-select': 'auto', 'text-align': item.type === 'FROM' ? 'left' : 'right'}"
                )
                  v-list-item-content
                    v-list-item-title {{ item.message }}
                    v-list-item-subtitle {{ item.type === 'FROM' ? `@${recipientUsername}` : 'You' }} - {{ moment(item.created_at).format('HH:mm') }}&nbsp;
                      span {{ {'SENDING': '⏳', 'SENT': '✔️', 'VERIFIED': '✔️✔️'}[item.type] }}
          v-text-field(
            v-if="recipientUsername"
            :disabled="!conversations[recipientUsername].isOnline || conversations[recipientUsername].generatingPSK"
            v-model="conversations[recipientUsername].unsent"
            style="width: 100%; margin-bottom: -24px;"
            :label="conversations[recipientUsername].generatingPSK ? 'Generating PSK by DH Key Exchange...' : 'Message'"
            append-icon="send"
            @click:append="submitMessage"
            v-on:keyup.enter="submitMessage")

        span.dis(style="padding-left: 12px; font-size: 9pt") Welcome, @{{ profile.username }}
</template>

<script>
import {BigInteger} from 'jsbn';
import getLargePrime from 'get-large-prime';
import moment from "moment";
import {apiRequest, BASE_URL} from "../plugins/utils";
import io from "socket.io-client";

export default {
  components: {},
  data: () => ({
    snackbarText: null,
    snackbar: false,
    loginValid: false,
    loggingIn: false,
    username: '',
    password: '',
    profile: null,
    socket: null,
    pickedUsername: null,
    recipientUsername: null,
    conversations: {},
    messageIDs: {}
  }),
  computed: {
    chatTitle () {
      if (this.recipientUsername && !this.conversations[this.recipientUsername].isOnline) {
        return `CURRENTLY OFFLINE: @${this.recipientUsername}`;
      }
      if (this.recipientUsername) {
        let pskFP = '';
        if (this.conversations[this.recipientUsername].psk) {
          pskFP = ` [${this.conversations[this.recipientUsername].psk.substr(0, 8)}]`;
        }
        return `CHAT WITH @${this.recipientUsername}${pskFP}`;
      }
      return 'PICK A RECIPIENT';
    }
  },
  watch: {
    async pickedUsername () {
      if (this.pickedUsername) {
        this.recipientUsername = this.pickedUsername;
        let r = this.recipientUsername;
        let c = this.conversations[r];
        if (c.chatLogs) {
          this.$set(c, 'readCount', c.chatLogs.length);
        }
        let generatePSK = false;
        if (!c.psk && !c.generatingPSK) {
          this.$set(c, 'generatingPSK', true);
          generatePSK = true;
        }
        await this.$nextTick();
        let el = this.$refs.logs.$el;
        el.scrollTop = el.scrollHeight;
        setTimeout(async () => {
          if (generatePSK) {
            // workaround different BigInteger version
            let p = (await getLargePrime(1024, 60000)).toString();
            p = new BigInteger(p);
            let g = new BigInteger('5');
            let tmpA = this.CryptoJS.HmacSHA512(p.toString(16), this.username + ',' + this.password).toString();
            let a = new BigInteger(tmpA, 16);
            let data = {
              phase: 1,
              to: r,
              A: g.modPow(a, p).toString(16),
              p: p.toString(16)
            };
            console.log('init dhKeyExchange', data);
            this.socket.emit('dhKeyExchange', data);
            setTimeout(async () => {
              if (!c.generatingPSK) return;
              this.snackbar = true;
              this.snackbarText = 'Recipient offline or duplicate login';
            }, 5000);
          }
        }, 200);
      }
    }
  },
  async mounted () {
    // setTimeout(this.login, 5000);
  },
  methods: {
    moment (...args) {
      return moment(...args);
    },
    submitMessage () {
      let to = this.recipientUsername;
      if (!this.conversations[to].isOnline || !this.conversations[to].psk) return;
      let message = this.conversations[to].unsent;
      if (!message) return;
      let now = Date.now();
      let id = JSON.stringify({from: this.profile.username, to, idx: this.conversations[to].chatLogs.length, created_at: now});
      this.conversations[to].chatLogs.push({id, type: "SENDING", message, created_at: now});
      this.$set(this.conversations[to], 'readCount', this.conversations[to].chatLogs.length);

      let crypt = this.CryptoJS.AES.encrypt(message, this.conversations[to].psk).toString();
      let messageHash = this.CryptoJS.HmacSHA512(message, this.conversations[to].psk).toString();
      let data = {id, to, crypt, messageHash};
      this.socket.emit("sendMessage", data);
      this.$set(this.conversations[to], 'unsent', '');
      requestAnimationFrame(() => {
        let el = this.$refs.logs.$el;
        el.scrollTop = el.scrollHeight;
      });
    },
    async request () {
      try {
        let resp = await apiRequest(...arguments);
        return resp.data;
      } catch (e) {
        console.error(e.response);
        this.snackbarText = e.response.data.message;
        this.snackbar = true;
      }
      return {};
    },
    setupIO (token) {
      this.socket = io(BASE_URL);
      this.socket.on("onlineUsers", onlineUsers => {
        Object.keys(onlineUsers).forEach(u => {
          if (!this.conversations[u]) {
            this.$set(this.conversations, u, {
              isOnline: true,
              unsent: "",
              readCount: 0,
              chatLogs: [],
              generatingPSK: false,
              psk: null
            });
          }
        });
        Object.keys(this.conversations).forEach(u => {
          if (this.conversations[u].isOnline !== onlineUsers[u]) {
            this.$set(this.conversations[u], "isOnline", !!onlineUsers[u]);
          }
        });
        this.pickedUsername = this.recipientUsername;
      });
      this.socket.on("receiveMessage", message => {
        if (this.messageIDs[message.id]) return; // duplicate
        this.$set(this.messageIDs, message.id, true);
        let {from} = message;
        if (!this.conversations[from].psk) {
          console.error('No psk?');
          return;
        }
        try {
          let plainText = this.CryptoJS.AES.decrypt(message.crypt, this.conversations[from].psk).toString(this.CryptoJS.enc.Utf8);
          let compareHash = this.CryptoJS.HmacSHA512(plainText, this.conversations[from].psk).toString();
          if (compareHash !== message.messageHash) throw new Error('Message hash mismatch');
          this.conversations[from].chatLogs.push({
            id: message.id,
            type: "FROM",
            message: plainText,
            created_at: Date.now()
          });
          this.socket.emit("verifiedMessage", message.id);
        } catch (e) {
          console.error(e);
        }

      });
      this.socket.on("messageStatus", status => {
        let {id, type} = status;
        let {to, idx} = JSON.parse(id);
        console.log("messageStatus", status);
        this.$set(this.conversations[to].chatLogs[idx], 'type', type);
      });
      this.socket.on("user", profile => {
        this.profile = profile;
      });
      this.socket.on("connect", () => {
        this.socket.emit("login", token);
      });
      this.socket.on("loginExpired", () => {
        this.profile = null;
        this.pickedUsername = null;
        this.recipientUsername = null;
        this.conversations = {};
        this.messageIDs = {};
        this.snackbar = true;
        this.snackbarText = `Login expired`;
      });
      this.socket.on("dhKeyExchange", (message) => {
        let {from, phase} = message;
        let isUpdate = !!this.conversations[from].psk;
        if (phase === 1) {
          let {A, p} = message;
          p = new BigInteger(p, 16);
          let g = new BigInteger('5');
          let tmpB = this.CryptoJS.HmacSHA512(p.toString(16), this.username + ',' + this.password).toString();
          let b = new BigInteger(tmpB, 16);
          let data = {
            phase: 2,
            to: from,
            B: g.modPow(b, p).toString(16),
            p: p.toString(16)
          };
          console.log('phase1 dhKeyExchange', data);
          this.socket.emit("dhKeyExchange", data);
          let psk = new BigInteger(A, 16).modPow(b, p).toString(16);
          this.$set(this.conversations[from], 'psk', psk);
          console.log({psk});
        } else if (phase === 2) {
          console.log('phase 2');
          let {B, from, p} = message;
          p = new BigInteger(p, 16);
          let tmpA = this.CryptoJS.HmacSHA512(p.toString(16), this.username + ',' + this.password).toString();
          let a = new BigInteger(tmpA, 16);
          let psk = new BigInteger(B, 16).modPow(a, p).toString(16);
          let c = this.conversations[from];
          this.$set(c, 'psk', psk);
          this.$set(c, 'generatingPSK', false);
          console.log({psk});
        }
        this.snackbar = true;
        if (isUpdate) {
          this.snackbarText = `PSK of @${from} updated`;
        } else {
          this.snackbarText = `Paired with @${from}`;
        }
      });
    },
    async login () {
      // Hash the password before send to server
      this.loggingIn = true;
      let password = this.CryptoJS.HmacSHA512(
        this.username,
        this.password
      ).toString();
      let {token} = await this.request("/login", {
        username: this.username,
        password
      });
      this.loggingIn = false;
      if (!token) return;
      this.setupIO(token);
    }
  }
};
</script>

<style scoped>
.v-textarea {
  font-family: "Courier New", Courier, monospace;
  font-size: 9pt;
}
.dis {
  opacity: 0.5;
}
.display-3 {
  font-weight: 900;
}
</style>
