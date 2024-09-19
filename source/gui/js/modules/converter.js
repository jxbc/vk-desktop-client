const module_name = 'CONVERTER';

const converter = {
	get_html: function() {
		let html = `<div class="contentBlock" id="interface.converter">
						<div class="h1">Конвентировать video/audio в голосовое</div>
						<div style="margin-top: 4px;">Выберете файл, затем выберете диалог, куда будет отправлено голосовое по окончанию конвертации.</div>
						<input type="file" id="fileVideoVoice" style="margin-top: 12px;">
					</div>
					<div class="contentBlock">
						<div class="h1">Выберете диалог</div>
						<div class="videoDialogs flex" style="flex-flow:wrap;"></div>
						<input type="file" id="preUploadFile" name="file" value="C:/VKClientTemp/temp.ogg" style="visibility: hidden;">
					</div>`;
		return html;
	},
	start: function() {
		getDialogs()
	}
};

async function getDialogs() {
	let dialogs = document.querySelector('.videoDialogs')
	let v = await vk.call('messages.getConversations', { count: 30 })
	let parse = v.items;
	let code = `<div class="button style3 videoDialog"></div>`

	for(let di of parse) {
		if(di.conversation.peer.type == 'user') {
			let usr = await vk.call('users.get', { user_ids: di.conversation.peer.id })
			dialogs.insertAdjacentHTML('beforeend', `<div class="button style3 videoDialog" uid="${usr.id}">${usr.first_name} ${usr.last_name}</div>`)
			await next(70)
		}
		else if(di.conversation.peer.type == 'chat') {
			let chat_name = di.conversation.chat_settings.title;
			dialogs.insertAdjacentHTML('beforeend', `<div class="button style3 videoDialog" style="background:#0066ff94;" uid="${di.conversation.peer.id}">${chat_name}</div>`)
			await next(20)
		}
	}

	eventDialog()
}

function eventDialog() {
	createAlert('Dialogs', 'Диалоги загружены, можно начинать загрузку')
	let dialog = document.querySelectorAll('.videoDialog')
	for(let o of dialog) {
		o.addEventListener('click', e => {
			let vv = document.querySelector('#fileVideoVoice')
			let path = vv.files[0].path
			createAlert('Конвертирование', 'Началось конвертирование, процесс будет оповещен')
			console.log(e.target.attributes.uid.value)
			createStream(e.target.attributes.uid.value, path)
		})
	}
}

async function createStream(peer, path) {
	window.vkc.videoToVoice(path, resolve => {
		createAlert('Еще чуть-чуть', 'Пожалуйста подождите')
		if(resolve == 'ok') {
			uploadMediaServer(peer)
		}
	})
}

async function uploadMediaServer(peer) {
	let upl = await vk.call('docs.getMessagesUploadServer', { type: 'audio_message' })
	uploadToServer(upl.upload_url, peer)
}

async function uploadToServer(server, peer) {
	let f = document.querySelector('#preUploadFile')
	let rt = window.vkc.oggToBlob()
	let formData = new FormData()
	let dataTransfer = new DataTransfer();

	await next(1000);
	let blob = new Blob([rt], {type: 'audio/ogg'})
	let file = new File([blob], 'temp.ogg')
	dataTransfer.items.add(file);


	createAlert('Yeeeah', 'Заключительные аккорды...')
	f.files = dataTransfer.files;

	formData.append('file', f.files[0])

	let r = await vk.upload(server, formData)
	let rr = await r.json()

	saveDocAndSendMessage(rr.file, peer)
}

async function saveDocAndSendMessage(file, peer) {
	let f = await vk.call('docs.save', { file: file })
	await sendVoice(f.audio_message, peer)
	
	createAlert('Успех', 'Успешно отправили в чат')
	createAlert('Внимание', 'Через 30 секунд страница обновит данные')
	
	await next(60000)
	render.next()
}

async function sendVoice(params, peer_id) {
	console.log(`[Client] Принял OUT ID: ${peer_id}`)
	let rtb = await vk.call('users.get', { user_ids: peer_id })
	console.log(`[Client] Отправляю сообщение для ${rtb.first_name} ${rtb.last_name} / id${rtb.id}`)
	let message = await vk.call('messages.send', {
		peer_id: peer_id,
		random_id: getRandomInt(1, 9999),
		attachment: `doc${params.owner_id}_${params.id}`
	})

	console.log(`[VK] Сообщение отправлено, msgid: ` + message)
	console.log(`[Client] Запасной вариант:  vk.com/doc${params.owner_id}_${params.id}` )
	copyTextToClipboard(`vk.com/doc${params.owner_id}_${params.id}`)
}