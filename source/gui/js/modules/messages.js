let MSGDATA = { push: 0, last_peer: null, last_fromid: null, active_dialog: null, state: null, reply: 0, encrypt: {status: 0, key: 'TRAVIS_SCOTT', autodecrypt: 1}, p2p: {state: 0, peering: null, protocol: null} }
let ATTACHS = { photo: null, reply: null, fwd: null, audio: null, voice: null, video: null }
let Media = import('./messenger/mediaViewer.js')
let controll = new AbortController()

export function startPolling() {
	SETTINGS.lp = 1;
	Events()
	setActiveDialog('all')
	loadDialogs()
	lpRun()
	newHotKeys()
	loadSettings()
}

function loadSettings() {
	if(storage.hasOwnProperty('messenger')) {
		let data = JSON.parse(storage.messenger)
		MSGDATA.push = data.push
	}
	else
	{
		let scheme = Object({
			push: 'private',
			animation: 1
		})
		storage.setItem('messenger', JSON.stringify(scheme))
		console.log(storage);
	}
}

//Создаем экземпляр LongPoll и слушаем события
async function lpRun() {
	const longpoll = await vk.longpoll()
	let all = document.querySelector('.dgChannel.all')
	let prv = document.querySelector('.dgChannel.private')
	let chts = document.querySelector('.dgChannel.chats')
	longpoll.listen('messages', (rp) => {
		console.log(rp)
		if(rp) {
			updateDialogs(rp)
			getMessagesByChat(MSGDATA.active_dialog, rp)
			updateCounters(rp)
			updatesOnMessages(rp)
			if(MSGDATA.push == 'private') {
				if('role' in rp && rp.role == 'user') pushSys(rp)
			}
		}
	})
}

//Загружаем диалоги в список
async function loadDialogs() {
	let r = await vk.call('messages.getConversations', { count: 30 })
	let all = document.querySelector('.dgChannel.all')
	let privates = document.querySelector('.dgChannel.private')
	all.setAttribute('count', r.unread_count)
	let type, id, title;
	let ph, last, unread, online;
	let private_counter = 0;
	render.build.mss.pins()

	for(let m of r.items) {
		if(MSGDATA.state == 'switch') return true;
		type = m.conversation.peer.type
		id = m.conversation.peer.id
		last = m.last_message.text

		if(type == 'chat') {
			title = m.conversation.chat_settings.title
			if(m.conversation.chat_settings.photo) ph = m.conversation.chat_settings.photo.photo_50
			online = 0
		}
		else if(type == 'user')
		{
			unread = m.conversation.unread_count ? m.conversation.unread_count : 0
			let t = await vk.call('users.get', {user_ids: id, fields: 'photo_50,last_seen,online'})
			title = `${t.first_name} ${t.last_name}`
			ph = t.photo_50
			online = t.online
			if(unread) private_counter++
		}
		else if(type == 'group') {
			title = 'Группы не поддерживаются'
			ph = ''
		}
		last = last.substring(0, 28)
		if(m.last_message.out) {
			last = `${render.build.blueSpan('Вы:')} ${last}`
		} else {
			let t = await vk.call('users.get', {user_ids: m.last_message.from_id, fields: 'photo_50'})
			last = `${render.build.blueSpan(`${t.first_name}:`)} ${last}`
		}
		unread = m.conversation.unread_count ? m.conversation.unread_count : 0

		if(m.conversation.sort_id.major_id != 0) {
			render.build.mss.dialogPinned({dialog: id, avatar: ph, name: title, last: last, unread: unread, online: online})
		}
		else {
			render.build.mss.dialog({dialog: id, avatar: ph, name: title, last: last, unread: unread, online: online})
		}

		let en = document.querySelector('#dialog'+id)

		en.addEventListener('click', e => {
			if(MSGDATA.state) return;
			let name = en.getAttribute('name')
			let dg = en.getAttribute('dialog')
			setWindowName(name)
			getMessagesByDialog(dg)
			setActiveDialog(dg)
		})
	}
	privates.setAttribute('count', private_counter)
}

async function loadOnlyUserDialogs() {
	let r = await vk.call('messages.getConversations', { count: 40 })
	let all = document.querySelector('.dgChannel.private')
	let type, id, title;
	let ph, last, unread;
	let unread_count = 0
	for(let m of r.items) {
		type = m.conversation.peer.type
		id = m.conversation.peer.id
		last = m.last_message.text

		if(type == 'user') {
			let t = await vk.call('users.get', {user_ids: id, fields: 'photo_50'})
			title = `${t.first_name} ${t.last_name}`
			ph = t.photo_50

			last = last.substring(0, 19)
			if(m.last_message.out) {
				last = `${render.build.blueSpan('Вы:')} ${last}`
			} else {
				let t = await vk.call('users.get', {user_ids: m.last_message.from_id, fields: 'photo_50'})
				last = `${render.build.blueSpan(`${t.first_name}:`)} ${last}`
			}
			unread = m.conversation.unread_count ? m.conversation.unread_count : 0
			render.build.mss.dialog({dialog: id, avatar: ph, name: title, last: last, unread: unread})
			let en = document.querySelector('#dialog'+id)
			if(unread) unread_count++;

			en.addEventListener('click', e => {
				if(MSGDATA.state) return;
				let name = en.getAttribute('name')
				let dg = en.getAttribute('dialog')
				setWindowName(name)
				getMessagesByDialog(dg)
				setActiveDialog(dg)
			})
		}
	}
	all.setAttribute('count', unread_count)
}

async function setWindowName(name) {
	let offs = 24
	let screen = document.querySelector('.messages_content')
	let tFormat = await import('./messenger/handler.js')
	controll.abort()
	controll = new AbortController()
	
	screen.addEventListener('scrollend', async e => {
				let a = screen.scrollTop;
				let pos = screen.scrollHeight - screen.clientHeight
				let per = a / pos
				
				if(per < -0.88) {
					await getMessagesByDialog(MSGDATA.active_dialog, offs)
					offs += 24
				}
	}, {signal: controll.signal})
	document.querySelector('.messages_header .title').innerHTML = tFormat.emoji(name)
}

//Загружаем сообщения по клику на диалог
async function getMessagesByDialog(id, offset = null) {
	let ms = document.querySelector('.messages')
	let peer = await vk.call('messages.getConversationsById', { peer_ids: id })
	let chat = await vk.call('messages.getHistory', { peer_id: id, count: 24 })
	if(offset) {
		chat = await vk.call('messages.getHistory', { peer_id: id, count: 24, offset: offset })
	}
	let title, read = peer.items[0].out_read, activity;
	if(peer.items[0].peer.type == "user") {
		let v = await vk.call('users.get', {user_ids: peer.items[0].peer.id})
		title = `${v.first_name} ${v.last_name}`
	} else {
		title = peer.items[0].chat_settings.title
	}
	MSGDATA.state = 1;

	if(!offset) ms.innerHTML = "";

	if(peer.items[0].peer.type == "user") {
		let u = await vk.call('users.get', { user_ids: peer.items[0].peer.id, fields: 'photo_50' })
		let active = await vk.call('messages.getLastActivity', {user_id: peer.items[0].peer.id})
		if('online' in active) {
			if(active.online) document.querySelector('._chat_activity').innerHTML = render.build.blueSpan('online')
			if(!active.online) document.querySelector('._chat_activity').innerHTML = `был(a) в сети ${unixTo(active.time)}`
		}
		for(let mg of chat.items) {
			let h = await handleDataByLoad(mg)
			if(mg.from_id == storage.id) {
				if(mg.id < read) {
					messageFromMe({time: mg.date, message: h.text, message_id: mg.id, check: 1}, 1)
				}
				else
				{
					messageFromMe({time: mg.date, message: h.text, message_id: mg.id}, 1)
				}
			}
			else
			{
				let nick = `${u.first_name} ${u.last_name}`
				let html = render.build.mss.messageSimple({avatar: u.photo_50, nickname: nick, textMedia: h.text, time: unixTo(mg.date), random: mg.id})
				ms.insertAdjacentHTML('afterbegin', html)
				addActions(mg.id)
			}
		}
	}
	else {
		if('active_ids' in peer.items[0].chat_settings) {
			let leng = peer.items[0].chat_settings.active_ids
			let memb = peer.items[0].chat_settings.members_count
			document.querySelector('._chat_activity').innerHTML = `Участники: ${memb} / активно: ${leng.length}`
		}
		let inf = await getUserinfoFromArray(chat.items)
		for(let mg of chat.items) {
			let h = await handleDataByLoad(mg)
			let u = await getSampleArray(inf, mg.from_id)
			if(mg.from_id == storage.id) {
				messageFromMe({time: mg.date, message: h.text, message_id: mg.id}, 1)
				addActions(mg.id)
			}
			else
			{
				let nick
				if(u && u.hasOwnProperty('name')) {
					nick = u.name
				}
				else if(u && u.hasOwnProperty('first_name')) {
					nick = `${u.first_name} ${u.last_name}`
				}
				else
				{
					nick = `/null/name`
				}
				let html = render.build.mss.messageSimple({avatar: u.photo_50, nickname: nick, textMedia: h.text, time: unixTo(mg.date), random: mg.id})
				ms.insertAdjacentHTML('afterbegin', html)
				addActions(mg.id)
			}
		}
	}
	
	MSGDATA.state = 0;
}

async function getUserinfoFromArray(arr) {
	let out = [];
	let ids = ''
	let groupIds = ''

	for(let i of arr) {
		if(i.from_id < 0) groupIds += `${i.from_id},`
		if(i.from_id > 0) ids +=  `${i.from_id},`
	}

	if(groupIds) {
		groupIds = groupIds.replaceAll('-', '')
		let m = await vk.call('groups.getById', { group_ids: groupIds, fields: 'photo_50' })
		let groups = m.groups
		out = [...groups]
	}
	if(ids) {
		ids = await vk.call('users.get', { user_ids: ids, fields: 'photo_50' })
		out = [...out, ...ids]
	}
	return out;
}

async function getSampleArray(arr, usr) {
	if(usr < 0) {
		usr = String(usr)
		usr = usr.replace('-', '')
		usr = Number(usr)
	}
	for(let i of arr) {
		if(i.id == usr) {
			return i
		}
	}
}

//Слушает события для сообщений (прочитано, удалено и тд)
async function updatesOnMessages(lp) {
	if(lp.type == 'view_out_message') {
		if(lp.peer_id == MSGDATA.active_dialog) {
			let parse = render.build.checkHTML('#mid'+lp.message_id)
			if(parse) {
				let msgout = document.querySelectorAll('.message.out .__group')
				for(let i of msgout) {
					if(i.getAttribute('checked') == 0) {
						i.setAttribute('checked', '1')
					}
				}
			}
		}
	}
}

function updateCounters(lp) {
	let all = document.querySelector('.dgChannel.all')
	let prv = document.querySelector('.dgChannel.private')
	let chts = document.querySelector('.dgChannel.chats')
	if(lp.type == 'message') {
		if(lp.peer_id == MSGDATA.active_dialog) return;
		let cheetos = render.build.checkHTML('#dialog'+lp.peer_id)
		if(cheetos) {
			let ssr = document.querySelector('#dialog'+lp.peer_id)
			let dat = ssr.getAttribute('unread')
			ssr.setAttribute('unread', (Number(dat) + 1))
		}

		if(lp.peer_id < 2000000000) {
			prv.setAttribute('count', Number(prv.getAttribute('count')) + 1)
		}
	}
	if(lp.type == 'view_message') {
		let cheetos = render.build.checkHTML('#dialog'+lp.peer_id)
		if(cheetos) {
			let ssr = document.querySelector('#dialog'+lp.peer_id)
			let dat = ssr.getAttribute('unread')
			ssr.setAttribute('unread', 0)
		}
		if(lp.peer_id < 2000000000) {
			if(prv.getAttribute('count') > 0) {
				prv.setAttribute('count', Number(prv.getAttribute('count')) - 1)
			}
		}
	}
	if(lp) {
		if(lp.type == 'counter_messages') {
			all.setAttribute('count', lp.count)
		}
	}
}

export default function switcher(c) {
	MSGDATA.push = c
}

function setActiveDialog(peer) {
	let ims = document.querySelector('.dialog#dialog'+peer)
	if(MSGDATA.active_dialog > 0) {
		let tim = document.querySelector('.dialog#dialog'+MSGDATA.active_dialog)
		if(tim.classList.contains('active')) {
			tim.classList.remove('active')
		}
	}
	if(ims) {
		ims.classList.add('active')
		ims.setAttribute('unread', 0)
	}
	MSGDATA.active_dialog = peer
	if(render.build.checkHTML(`.messanger_input .reply`)) {
		document.querySelector('.messanger_input .reply').remove()
		MSGDATA.reply = 0;
	}
}

//Обработчик сообщений при загрузке диалога
async function handleDataByLoad(ft) {
	let data;
	if(ft.attachments.length > 0) {
		if(ft.attachments[0].type == 'photo') {
			for(let ph of ft.attachments[0].photo.sizes) {
				if(ph.type == 'x') {
					data = `<img src="${ph.url}" class="button imageViewer" original="${ft.id}">`
				}
				else if(ph.type == 'y') {
					data = `<img src="${ph.url}" class="button imageViewer" original="${ft.id}">`
				}
				else if(ph.type == 'q') {
					data = `<img src="${ph.url}" class="button imageViewer" original="${ft.id}">`
				}
			}
			if(ft.text) data = render.build.div(ft.text) + data
		}
		if(ft.attachments[0].type == 'sticker') {
			data = `<img class="stick" src="https://vk.com/sticker/1-${ft.attachments[0].sticker.sticker_id}-128">`
		}
		if(ft.attachments[0].type == 'video') {
			data = render.build.blueSpan('Не удалось спарсить видео фрагменты [modules/messages/handler]')
		}
		if(ft.attachments[0].type == 'audio') {
			data = render.build.blueSpan('На данный момент музыка не поддерживается [modules/audio]')
		}
		if(ft.attachments[0].type == 'audio_message') {
			let audio = ft.attachments[0].audio_message.link_ogg
			let html = `<audio controls controlslist="nodownload" preload="metadata"><source src="${audio}" type="audio/ogg"></audio>`
			data = html
		}
	}
	else
	{
		if(MSGDATA.encrypt.autodecrypt) {
			if(String(ft.text).includes('vkdc::')) {
				let aes = window.vkc.decrypt(ft.text)
				if(aes.error) {
					ft.text = render.build.blueSpan('[Ошибка дескриптора]: Попытка взломать или обойти алгоритмы дешифрования. Вы в безопасности, все хорошо.')
				}
				else
				{
					ft.text = aes + render.build.blueSpan(' (AES)')
				}
			}
		}
		let ha = await import('./messenger/handler.js')
		let code = await ha.codeParse(ft.text)
		if(code) {
			ft.text = code
		}
		return {text: ha.emoji(ft.text)}
	}
	return {text: data};
}

//Обработчик сообщений из LongPoll
async function handleData(lp, typer = null) {
	let data, reply = 0;
	if(lp) {
		if(lp.type) {
			if(lp.attachment){
				if(lp.attachment.type == "photo") {
					let ph = await vk.call('messages.getById', {message_ids: lp.message_id})
					let att = ph.items[0].attachments
					for(let r of att) {
						if(r.type == "photo") {
							for(let tid of r.photo.sizes)
							{
								if(tid.type == 'x') {
									data = `<img src="${tid.url}" class="button imageViewer" original="${lp.message_id}">`
								}
								else if(tid.type == 'y') {
									data = `<img src="${tid.url}" class="button imageViewer" original="${lp.message_id}">`
								}
								else if(tid.type == 'q') {
									data = `<img src="${tid.url}" class="button imageViewer" original="${lp.message_id}">`
								}
							}
						}
					}

					if(lp.message) data = render.build.div(lp.message) + data 
					if(typer == 'dialogs') data = render.build.blueSpan('Фото')
				}
				if(lp.attachment.type == 'sticker') {
					let pee = JSON.parse(lp.attachment.attach)
					for(let rr of pee[0].sticker.images) {
						if(rr.height == 128) {
							data = `<img src="${rr.url}" class="stick">`
						}
						else if(rr.height == 64) {
							data = `<img src="${rr.url}" class="stick">`
						}
					}
					if(typer == 'dialogs') data = render.build.blueSpan('Стикер')
				}
				if(lp.attachment.type == 'video') {
					data = render.build.blueSpan('Видео')
				}
				if(lp.attachment.type == 'audio') {
					data = render.build.blueSpan('Музыка')
				}
				if(lp.attachment.type == 'audio_message') {
					data = render.build.blueSpan('> Голосовое сообщение')
				}
				if(lp.attachment.type == 'doc') {
					let pee = JSON.parse(lp.attachment.attach)
					if(pee[0].type == "audio_message") {
						let audio = pee[0].audio_message.link_mp3
						let html = `<audio controls controlslist="nodownload" preload="metadata"><source src="${audio}" type="audio/ogg"></audio>`
						data = html
					}
					if(typer == 'dialogs') data = render.build.blueSpan('Immutable Message')
				}
				if(lp.attachment.type == 'wall') {
					data = render.build.blueSpan('Запись на стене')
				}
				if(lp.attachment.type == 'reply_attach') {
					let pee = JSON.parse(lp.attachment.attach)
					if(pee[0].type == "sticker") {
						for(let rr of pee[0].sticker.images) {
							if(rr.height == 128) {
								data = `<img src="${rr.url}" class="stick">`
							}
						}
						if(typer == 'dialogs') data = render.build.blueSpan('Стикер')
					}
				}
				if(lp.attachment.type == 'reply') {
					let pee = JSON.parse(lp.attachment.attach)
					let v = await vk.call('messages.getByConversationMessageId', {peer_id: lp.peer_id, conversation_message_ids: pee.conversation_message_id})
					let fromm = await vk.call('users.get', {user_ids: v.items[0].from_id})
					reply = { text: v.items[0].text, from: v.items[0].from_id, name: `${fromm.first_name} ${fromm.last_name}` }
					if(typer == 'dialogs') data = lp.message
				}
				if(lp.attachment.type == 'fwd') {
					//let pv = await vk.call('messages.getById', {message_ids: lp.message_id})
					data = render.build.blueSpan('>> Пересланные сообщения [treeConstructor()::not called stack]')
					if(typer == 'dialogs') data = render.build.blueSpan('Пересланные сообщения')
				}
			}
			else
			{
				let ha = await import('./messenger/handler.js')
				let code = await ha.codeParse(lp.message)
				if(code) {
					data = code
				}
				if(code && typer == 'dialogs') { 
					data = render.build.blueSpan('код')
				}
				if(data)
				{
					return { message: data }
				}
				return { message: ha.emoji(lp.message) } //Если аттачментов не было, возвращается сообщение
			}
			return { message: data, reply: reply } //Возвращаются обработанные строки
		}
	}
}

function unixTo(unix) {
	unix = unix * 1000
	let hours = new Date(unix).getHours()
	let min = new Date(unix).getMinutes()

	if(hours.toString().length < 2) hours = "0" + hours
	if(min.toString().length < 2) min = "0" + min

	return  hours + ":" + min
}

//Принимает все входящие события от LongPoll для активного диалога
async function getMessagesByChat(id, lp) {
	let cr = document.querySelector('.messages')
	let usr, reply = 0;
	if(lp) {
		if(lp.type == "message" || lp.type == "reply") {
			if(id == lp.peer_id) {
				if(lp.type == 'typing') return;
				if(lp.edited) {
					let mid = document.querySelector('#mid'+lp.message_id+' .msgblock .text .text')
					mid.innerHTML = lp.message + render.build.blueSpan('ред.');
					return 1;
				}
				if(lp.peer_id) {
					let handle = await handleData(lp)
					if(handle.message) lp.message = handle.message
					reply = handle.reply
				}
				if(lp.peer_id < 2000000000) {
					if(lp.out) {
						if(SETTINGS.msg_slow_mode == 0) return messageFromMe(lp, 2)
						messageFromMe(lp)
						return 1;
					}
					else {
						usr = await vk.call('users.get', {user_ids: lp.peer_id, fields: 'photo_50'})
					}
				} else {
					if(lp.user_id == storage.id) {
						if(SETTINGS.msg_slow_mode == 0) return messageFromMe(lp, 2)
						messageFromMe(lp)
						return 1;
					}
					usr = await vk.call('users.get', {user_ids: lp.user_id, fields: 'photo_50'})
				}
				if(MSGDATA.encrypt.autodecrypt) {
					if(String(lp.message).includes('vkdc::')) {
						let aes = window.vkc.decrypt(lp.message)
						if(aes.error) {
							lp.message = render.build.blueSpan('[Ошибка дескриптора]: Попытка взломать или обойти алгоритмы дешифрования. Вы в безопасности, все хорошо.')
						}
						else
						{
							lp.message = aes + render.build.blueSpan(' (AES)')
						}
					}
				}
				
				let nick = `${usr.first_name} ${usr.last_name}`
				let html;
				if(SETTINGS.msg_slow_mode) {
					html = render.build.mss.message({avatar: usr.photo_50, nickname: nick, textMedia: lp.message, time: unixTo(lp.time), random: lp.message_id}, reply)
					if(MSGDATA.last_fromid == lp.user_id) {
						html = render.build.mss.message({avatar: usr.photo_50, nickname: nick, textMedia: lp.message, avatarHidden: 1, time: unixTo(lp.time), random: lp.message_id}, reply)
					}
				}
				else
				{
					html = render.build.mss.messageSimple({avatar: usr.photo_50, nickname: nick, textMedia: lp.message, time: unixTo(lp.time), random: lp.message_id}, reply)
					if(MSGDATA.last_fromid == lp.user_id) {
						html = render.build.mss.messageSimple({avatar: usr.photo_50, nickname: nick, textMedia: lp.message, avatarHidden: 1, time: unixTo(lp.time), random: lp.message_id}, reply)
					}
				}

				MSGDATA.last_peer = lp.peer_id
				MSGDATA.last_fromid = lp.user_id

				let s = cr.insertAdjacentHTML('beforeend', html)
				addActions(lp.message_id)

				if(SETTINGS.msg_slow_mode == 0) return true;

				let msgg = document.querySelector('#mid'+lp.message_id)
				let im = document.getElementById('im'+lp.message_id)
				
				setH(im, msgg.offsetHeight + 1, 0)
				await next(50)
				msgg.classList.remove('opacity0')
				await next(160)
				msgg.classList.remove('posab')
				await next(520)
				updateH(im)
			}
		}
	}
}

//Вешаем действия на сообщения (ответить, редактировать, реакции и тд)
async function addActions(id) {
	let im = document.getElementById('im'+id)
	let nickname = document.querySelector(`#im${id} .__group .msgblock .nickname`)
	let msg = document.querySelector(`#im${id} .__group .msgblock .text`)
	let media = render.build.checkHTML(`#im${id} .__group .msgblock .text .text img`) ? document.querySelector(`#im${id} .__group .msgblock .text .text img`) : 0
	let enter = document.querySelector(`.messanger_input`)
	let input = render.build.mss.input()
	im.addEventListener('dblclick', e => {
		if(MSGDATA.reply) {
			let rep = document.querySelector('.messanger_input .reply')
			rep.remove()
		}
		if(render.build.checkHTML(`.messanger_input .reply`)) {
			document.querySelector('.messanger_input .reply').remove()
		}
		MSGDATA.reply = id
		input.insertAdjacentHTML('afterbegin', render.build.mss.replyMessage({id: id, message: `${nickname.outerText}: ${msg.outerText}`}))
		enter.setAttribute('style', 'bottom: 9px;')
	})
	if(media) {
		let view = await import('./messenger/mediaViewer.js')
		media.addEventListener('click',  async e => {
			await view.image(media.getAttribute('original'))
		})
	}
}

//Отрисовывает сообщения от меня
async function messageFromMe(lp, simple = 0) {
	let mmid, check = lp.check ? 1 : 0, reply = MSGDATA.reply
	if(reply) {
		mmid = await vk.call('messages.getById', {message_ids: reply})
		mmid = mmid.items[0].text
	}
	if(MSGDATA.encrypt.status) {
		if(String(lp.message).includes('vkdc::')) {
			lp.message = window.vkc.decrypt(lp.message) + render.build.blueSpan(' (AES)')
		}
	}
	let cr = document.querySelector('.messages')
	let html = render.build.mss.messageOut({
		textMedia: lp.message, time: unixTo(lp.time), random: lp.message_id, check: 0
	}, mmid)

	MSGDATA.last_peer = lp.peer_id
	MSGDATA.last_fromid = lp.user_id
	if(lp.role == 'user') {
		if(lp.out) MSGDATA.last_fromid = storage.id
	}
	
	MSGDATA.reply = 0;
	if(simple == 2) {
		html = render.build.mss.messageOutSimple({
			textMedia: lp.message, time: unixTo(lp.time), random: lp.message_id, check: 0
		})
		cr.insertAdjacentHTML('beforeend', html)
		return
	}
	if(simple) {
		html = render.build.mss.messageOutSimple({
			textMedia: lp.message, time: unixTo(lp.time), random: lp.message_id, check: check
		})
		cr.insertAdjacentHTML('afterbegin', html)
		return
	}
	cr.insertAdjacentHTML('beforeend', html)
	if(simple) return;
	let msgg = document.querySelector('#mid'+lp.message_id)
	let im = document.getElementById('im'+lp.message_id)
				
	setH(im, msgg.offsetHeight + 1, 0)
	await next(50)
	msgg.classList.remove('opacity0')
	await next(160)
	msgg.classList.remove('posab')
	await next(520)
	updateH(im)
}

//Обновляет список диалогов событиями из LP
async function updateDialogs(lp) {
	let diag = document.querySelectorAll('.dialog')
	for(let d of diag) {
		if(lp.peer_id == d.getAttribute('dialog')) {
			render.build.mss.moveDialog(lp.peer_id)
			let h = await handleData(lp, 'dialogs')
			let rs = document.querySelector(`#${d.id} .namesinfo .lastmessage`)
			if(lp.type == 'typing') {
				let u = await vk.call('users.get', {user_ids: lp.user_ids[0]})
				rs.innerHTML = render.build.blueSpan(`${u.first_name} пишет...`)
			}
			if(lp.type == 'message') { 
				if(lp.role == 'chat') {
					if(lp.user_id == storage.id) return rs.innerHTML = `${render.build.blueSpan('Вы:')} ${h.message}`
					let u = await vk.call('users.get', {user_ids: lp.user_id})
					rs.innerHTML = `${render.build.blueSpan(u.first_name + ':')} ${h.message}`
				}
				else {
					if(lp.out) return rs.innerHTML = `${render.build.blueSpan('Вы:')} ${h.message}`
					let u = await vk.call('users.get', {user_ids: lp.peer_id})
					rs.innerHTML = `${render.build.blueSpan(u.first_name + ':')} ${h.message}`
				}
			}
		}
	}
}

async function Events() {
	let srvb = document.querySelector('.sendService')
	let emoj = document.querySelector('.sendEmoji')
	let attach = document.querySelector('.attachFiles')
	let privates = document.querySelector('.dgChannel.private')
	let allDg = document.querySelector('.dgChannel.all')
	let dgChannel = document.querySelectorAll('.dgChannel')
	let secure = document.querySelector('.secureMsg')
	let Render = render.build.mss

	let state = {attach: null}
	srvb.addEventListener('click', async e => {
		let s = await vk.call('messages.sendService', { peer_id: MSGDATA.active_dialog, action_type: 'chat_screenshot' })
		if(s.error) {
			createAlert('Ошибка', 'Нужно авторизоваться с VK Me')
		}
	})
	emoj.addEventListener('click', async e => {
		await sendMessage(``, 0, 51590)
	})
	privates.addEventListener('click', async e => {
		let dialog = document.querySelectorAll('.dialog')
		MSGDATA.state = 'switch';
		for(let i of dialog) {
			i.remove()
		}
		fnc.setActiveTab('private')
		await loadOnlyUserDialogs()
		MSGDATA.state = 0;
	})
	allDg.addEventListener('click', async e => {
		let dialog = document.querySelectorAll('.dialog')
		for(let i of dialog) {
			i.remove()
		}
		fnc.setActiveTab('all')
		await loadDialogs()
	})
	secure.addEventListener('click', async e => {
		if(MSGDATA.encrypt.status) {
			secure.setAttribute('style', `filter: var(--bluedark_filter)`)
			MSGDATA.encrypt.status = 0
		}
		else
		{
			secure.setAttribute('style', `filter: var(--blue_filter)`)
			MSGDATA.encrypt.status = 1
			createAlert('Сообщения защищены', 'Включено активное шифрование')
		}
	})
	attach.addEventListener('click', ext => {
		Render.attachmentList(document.querySelector('.messanger_others'))
		state.attach = 1
		
		let steps = document.querySelectorAll('.list .listProp')

		document.querySelector('.attachList').addEventListener('mouseout', ext => {
			if(state.attach == 2) return;
			state.attach = 0
			let list = document.querySelector('.list')
			list.remove()
		})
		for(let i of steps) {
			if(i.getAttribute('type') == 'voiceAttach') {
				i.addEventListener('click', () => fnc.voiceAttach())
			}
		}
	})
	attach.addEventListener('mouseout', ext => {
		if(state.attach == 1) return;
		if(state.attach == 2) return;
		let list = document.querySelector('.list')
		list.remove()
	})

	let fnc = {
		setActiveTab: function(name) {
			for(let i of dgChannel) {
				if(i.classList.contains('active')) {
					i.classList.remove('active')
					document.querySelector('.dgChannel.'+name).classList.add('active')
				}
			}
		},
		voiceAttach: async function() {
			let file = document.querySelector('#voiceAttachInput')
			file.addEventListener('change', async ex => {
				let selected = file.files;
				if(selected) {
					let stream = await import('./messenger/voiceToFile.js')
					await stream.createStream(MSGDATA.active_dialog, selected[0].path)
				}
			})
		}
	}
}

async function removeLocalMessage(id) {
	await next(60000)
	id.remove()
	return 1;
}

export async function sendMessage(message, attach = null, sticker = null) {
	let rn = getRandomInt(1, 5000)
	if(MSGDATA.encrypt.status == 1) {
		message = window.vkc.encrypt(message)
	}
	if(MSGDATA.reply && sticker) {
		let rep = document.querySelector('.messanger_input .reply')
		await vk.call('messages.send', {peer_id: MSGDATA.active_dialog, message: message, random_id: rn, reply_to: MSGDATA.reply, sticker_id: sticker})
		rep.remove()
		return true;
	}
	if(MSGDATA.reply) {
		let rep = document.querySelector('.messanger_input .reply')
		await vk.call('messages.send', {peer_id: MSGDATA.active_dialog, message: message, random_id: rn, reply_to: MSGDATA.reply})
		rep.remove()
		return true;
	}
	if(sticker) {
		return await vk.call('messages.send', {peer_id: MSGDATA.active_dialog, message: message, random_id: rn, sticker_id: sticker})
	}
	let sa = await vk.call('messages.send', {peer_id: MSGDATA.active_dialog, message: message, random_id: rn})
	if(!sa) return await sendMessage(message, attach, sticker)
	return true
}

function newHotKeys() {
	window.addEventListener("paste", pasteHandler);
	window.addEventListener('input', async r => {
		if(storage.path == "messanger") {
			let inp = document.querySelector('.messanger_input')
			let input = document.querySelector('.messanger_input .input')
			if(inp.offsetHeight < 70) {
				inp.setAttribute('style', ``)
			}
			else if(inp.offsetHeight > 80 && inp.offsetHeight < 400) {
				inp.setAttribute('style', `bottom: ${inp.offsetHeight / 2}px;`)
			}

			let emoj = await import('./messenger/handler.js')
		}
	})
	window.addEventListener('keypress', async k => {
		if(storage.path == "messanger" && k.code == "Enter" && k.shiftKey == true) {
			return
		}
		if(storage.path == "messanger" && k.code == "Enter") {
			let qr = document.querySelector('.input')
			k.preventDefault()
			await sendMessage(qr.outerText)
			qr.innerHTML = ''
			document.querySelector('.messanger_input').setAttribute('style', ``)
		}
	})
}

function pasteHandler(e) {
	if(e.clipboardData) {
		let items = e.clipboardData.items
		if(!items) return false;
		for(let i of items) {
			if(i.type.indexOf('image') > -1) {
				e.preventDefault()
				let blob = i.getAsFile();
				let URLObj = window.URL || window.webkitURL;
				let source = URLObj.createObjectURL(blob);
				console.log(source)

				let data = new FormData();
				data.append('file', blob)
			}
		}
	}
}

async function setH(obj, h, d) {
	for(let i=0; i < h; i++){
		i * 1.5
		await next(d)
		obj.setAttribute('style', `height: ${i}px;`)
	}
}
function updateH(obj) {
	obj.setAttribute('style', ``)
}

async function pushSys(lp) {
	let usr
	if(lp) {
		if(lp.type == 'message') {
			if(lp.out) return false
			if(lp.peer_id) {
				let handle = await handleData(lp, 'dialogs')
				if(handle.message) lp.message = handle.message
			}
			if(lp.peer_id < 2000000000) {
				usr = await vk.call('users.get', {user_ids: lp.peer_id, fields: 'photo_50'})
				usr = { first: usr.first_name, last: usr.last_name, photo: usr.photo_50 }
			}
			createAlert(`${usr.first} ${usr.last}`, lp.message, usr.photo)
		}
	}
}

async function msg__alerts(lp) {
	let rp = lp;
	if(rp) {
						if(rp.type == 'message') {
							if(!rp.user_id) rp.user_id = rp.peer_id;
							let usr = await vk.call('users.get', {user_ids: rp.user_id, fields: 'photo_100'})
							if(rp.message == "") {
								if(rp.attachment.type == "sticker") {rp.message = render.build.blueSpan('Стикер');}
								else if(rp.attachment.type == "photo") {rp.message = render.build.blueSpan('Изображение');}
								else if(rp.attachment.type == "doc") {rp.message = render.build.blueSpan('Голосовое сообщение');}
								else if(rp.attachment.type == "audio") {rp.message = render.build.blueSpan('Музыка');}
								else if(rp.attachment.type == "wall") {rp.message = render.build.blueSpan('Публикация со стены');}
								else if(rp.attachment.type == "link") {rp.message = render.build.blueSpan('Ссылка');}
								else if(rp.attachment.type == "video") {rp.message = render.build.blueSpan('Видео');}
							}
							if(rp.user_id == rp.peer_id)
							{
								createAlert(`${usr.first_name} ${usr.last_name}`, rp.message, usr.photo_100);
							}
							else
							{
								createAlert(`${usr.first_name} ${usr.last_name} ${render.build.blueSpan('[чат]')}`, rp.message, usr.photo_100);
							}
						}
					}
}