export async function image(id) {
	let msg = await vk.call('messages.getById', { message_ids: id })
	let sizes = msg.items[0].attachments[0].photo.sizes
	let list = Object()
	for(let i of sizes) {
		if(i.type == 'z') {
			list.maxSize = i.url
		}
		if(i.type == 'y') {
			list.mediumSize = i.url
		}
		if(i.type == 'x') {
			list.smallSize = i.url
		}
	}

	if('maxSize' in list && list.maxSize) {
		return render.build.popupWindow(render.build.mediaView(list.maxSize))
	}
	else if('mediumSize' in list && list.mediumSize) {
		return render.build.popupWindow(render.build.mediaView(list.mediumSize))
	}
	else if('smallSize' in list && list.smallSize) {
		return render.build.popupWindow(render.build.mediaView(list.smallSize))
	}
}
export async function video(path) {
	//Cutter for this build by Babel Compiler
}
export async function audio(path) {
	//Cutter for this build by Babel Compiler
}