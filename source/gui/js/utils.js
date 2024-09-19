const API_VERSION = '5.195'
const BASE_URL = 'https://api.vk.com/method/'
const AUTH_URL = 'https://oauth.vk.com/token?'

class VK {
	constructor(access_token = null) {
		if(access_token == null) return 1
		if(access_token) {
			this.token = access_token
		}
	}

	async call(method, params) {
		let res = await fetch(BASE_URL + method + '?' + new URLSearchParams(params) + '&v=' + API_VERSION + '&access_token=' + this.token)
		let jres = await res.json();
		if(jres.error) return jres;
		if(jres.response) {
			if(jres.response[1]) return jres.response;
			if(jres.response[0]) return jres.response[0];
			return jres.response;
		}
		return jres;
	}

	async upload(server, jsonObject) {
		let res = await fetch(server, 
		{
			method: 'POST',
			body: jsonObject
		})

		return res
	}

	async auth(phone, password) {
		let res = await fetch(AUTH_URL + 'grant_type=password&client_id=2274003&client_secret=hHbZxrka2uZ6jB1inYsH&scope=offline&username=' + phone + '&2fa_support=1&password=' + password + '&v=' + API_VERSION) 
		let r = await res.json()
		return r
	}

	async longpoll() {
		let srv = await this.call('messages.getLongPollServer', {need_pts: 1, lp_version: 3})
		let THIS = new VK()
		return Object({
			listen: function(on, max) {
				if(on == 'messages')
				{
				THIS.lp_updates(srv, async (r) => {
					THIS.lp_handler(r.updates, out => {
						max(THIS.lp_parser(out))
					})		
				})}
			}
		})
	}

	lp_parser(input) {
		if(!input) return;
		if(input[0] == 4) {
			let role;
			if(input[4] > 2000000000) {
				role = 'chat'
			}
			else
			{
				role = 'user'
			}
			if(input[8].attach1 || input[8].reply || input[8].fwd) {
				if(input[8].reply && input[8].attach1) {
					return Object({ type: 'reply', flag: input[2], role: role, message: input[6], peer_id: input[4], time: input[5], user_id: input[7].from, message_id: input[1], attachment: {type: 'reply_attach', attach: input[8].attachments, link: input[8].attach1, reply: input[8].reply} })
				}
				if(input[8].reply) {
					if(!input[7].from) {
						for(let num of [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 65536]) {
							if(input[2] & num) {
								if(num == 2) {
									return Object({ type: 'message', message: input[6], peer_id: input[4], time: input[5], out: 1, private: 1, message_id: input[1], attachment: {type: 'reply', attach: input[8].reply} })
								}
							}
						}
						return Object({ type: 'message', message: input[6], peer_id: input[4], time: input[5], private: 1, message_id: input[1] })
					}
					return Object({ type: 'message', flag: input[2], role: role, message: input[6], peer_id: input[4], time: input[5], user_id: input[7].from, message_id: input[1], attachment: {type: 'reply', attach: input[8].reply} })
				}
				if(input[8].attach1) {
					if(role == 'user') {
						for(let num of [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 65536]) {
							if(input[2] & num) {
								if(num == 2) {
									return Object({ type: 'message', message: input[6], peer_id: input[4], time: input[5], out: 1, private: 1, message_id: input[1], attachment: {type: input[8].attach1_type, attach: input[8].attachments, extends: input[8]} })
								}
							}
						}
					}
					return Object({ type: 'message', flag: input[2], role: role, message: input[6], peer_id: input[4], time: input[5], user_id: input[7].from, message_id: input[1], attachment: {type: input[8].attach1_type, attach: input[8].attachments, link: input[8].attach1, extends: input[8]} })
				}
				if(input[8].fwd) {
					return Object({ type: 'message', flag: input[2], role: role, message: input[6], peer_id: input[4], time: input[5], user_id: input[7].from, message_id: input[1], attachment: {type: 'fwd'} })
				}
			}
			else
			{
				if(!input[7].from) {
					for(let num of [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 65536]) {
						if(input[2] & num) {
							if(num == 2) {
								return Object({ type: 'message', message: input[6], peer_id: input[4], time: input[5], out: 1, private: 1, message_id: input[1], role: role })
							}
						}
					}
					return Object({ type: 'message', message: input[6], peer_id: input[4], time: input[5], role: role, private: 1, message_id: input[1] })
				}
				return Object({ type: 'message', role: role, message: input[6], peer_id: input[4], time: input[5], user_id: input[7].from, message_id: input[1] })
			}
		}
		else if(input[0] == 5) {
			let role;
			if(input[3] > 2000000000) {
				role = 'chat'
			}
			else {
				role = 'user'
			}
			return Object({ type: 'message', role: role, edited: 1, message: input[5], peer_id: input[3], time: input[4], user_id: input[6].from, message_id: input[1] })
		}
		else if(input[0] == 63) {
			let role;
			if(input[1] > 2000000000) {
				role = 'chat'
			}
			else {
				role = 'user'
			}
			return Object({ type: 'typing', role: role, peer_id: input[1], user_ids: input[2]})
		}
		else if(input[0] == 6) {
			return Object({ type: 'view_message', peer_id: input[1], message_id: input[2]})
		}
		else if(input[0] == 7) {
			return Object({ type: 'view_out_message', peer_id: input[1], message_id: input[2]})
		}
		else if(input[0] == 8) {
			return Object({ type: 'friend_online', peer_id: input[1]})
		}
		else if(input[0] == 9) {
			return Object({ type: 'friend_offline', peer_id: input[1]})
		}
		else if(input[0] == 18) {
			return Object({ type: 'media_message', message_id: input[1], flags: input[2], peer_id: input[3], time: input[4], from: input[6], attachment: {attach: input[7].attachments}})
		}
		else if(input[0] == 21) {
			return Object({ type: 'remove_message_forall', peer_id: input[1], message_id: input[2]})
		}
		else if(input[0] == 52) {
			return Object({ type: 'chat_edit', peer_id: input[1], info: input[2]})
		}
		else if(input[0] == 64) {
			return Object({ type: 'typing_audio', user_ids: input[1], peer_id: input[2]})
		}
		else if(input[0] == 64) {
			return Object({ type: 'typing_audio', user_ids: input[1], peer_id: input[2]})
		}
		else if(input[0] == 80) {
			return Object({ type: 'counter_messages', count: input[1]})
		}
		else if(input[0] == 601) {
			if(input[1] == 1) {
				return Object({ type: 'reaction', peer_id: input[2], state: 1, cmid: input[3], reaction_id: input[4], reaction: input[7], from_id: input[10]})
			}
			if(input[1] == 3) {
				return Object({ type: 'reaction', peer_id: input[2], state: 0, cmid: input[3], reaction_id: input[4]})
			}
		}
		else if(input[0] == 602) {
			return Object({ type: 'remove_message', peer_id: input[1], message_id: input[2]})
		}
	}

	lp_handler(input, output) {
		if(input.length > 0) {
			for(let upd of input) {
				output(upd)
			}
		}
	}

	async lp_fetch(srv) {
		let lp = await fetch(`https://${srv.server}?act=a_check&key=${srv.key}&ts=${srv.ts}&wait=25&mode=66&version=14`)
		let jsoned = await lp.json();
		return jsoned
	}

	async lp_updates(srv, callback) {
		let fet;
		let ts;
		while(SETTINGS.lp) {
			fet = await this.lp_fetch(srv)
			srv.ts = fet.ts
			callback(fet)
		}
	}

	long = Object({
		ripe: 1
	})
}

let next = (timex) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, timex)
  });
}