async function uploadMediaServer(peer) {
	let upl = await vk.call('docs.getMessagesUploadServer', { type: 'audio_message' })
	render.build.setProgress(44)
	uploadToServer(upl.upload_url, peer)
}

export async function createStream(peer, path) {
	render.build.createProgressBar('загружаем модули...')
	window.vkc.videoToVoice(path, resolve => {
		render.build.setProgress(34)
		render.build.setProgressName('собираем аудио...')
		if(resolve == 'ok') {
			uploadMediaServer(peer)
		}
	})
}

async function uploadToServer(server, peer) {
	let rt = window.vkc.oggToBlob()
	let formData = new FormData()
	let dataTransfer = new DataTransfer();

	await next(1000);
	let blob = new Blob([rt], {type: 'audio/ogg'})
	let file = new File([blob], 'temp.ogg')
	dataTransfer.items.add(file);

	render.build.setProgress(67)
	render.build.setProgressName('немного магии...')

	formData.append('file', file)

	let r = await vk.upload(server, formData)
	let rr = await r.json()

	saveDocAndSendMessage(rr.file, peer)
}

async function saveDocAndSendMessage(file, peer) {
	render.build.setProgress(90)
	render.build.setProgressName('подготовка к отправке')
	let f = await vk.call('docs.save', { file: file })
	await sendVoice(f.audio_message, peer)
	
	render.build.setProgress(100)
	render.build.setProgressName('отправлено')
	await next(1000)
	render.build.removeProgressBar()
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