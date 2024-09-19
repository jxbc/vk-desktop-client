let im = render.build.mss

export function codeCheck(text) {
	text = String(text)
	if(text.indexOf('`') > -1) { 
		return 1;
	}
	return 0;
}
export async function codeParse(text) {
	text = String(text)
	if(text.indexOf('`') > -1) {
		let match = /`([^`]+)`$/su
		let match2 = /```([^`]+)```$/su
		match = text.match(match)
		match2 = text.match(match2)
		
		if(match) {
			match = match[1].replaceAll('`', '')
		}
		if(match2) {
			match = match2[1].replace('javascript', '<span class="orange title">JavaScript</span>')
		}

		if(!match) return false;
		
		return im.code(syntax(match))
	}
}

function syntax(input) {
	input = String(input)
	input = input.replace('<br>', '')
	let keys = {
		'let': '<span class="magenta">let</span>',
		'var': '<span class="magenta">let</span>',
		'null': '<span class="orange">null</span>',
		'if': '<span class="magenta">if</span>',
		'else': '<span class="magenta">else</span>',
		'const': '<span class="blue">const</span>',
		'function': '<span class="magenta">function</span>',
		'return': '<span class="magenta">return</span>',
		'async': '<span class="purple">async</span>',
		'await': '<span class="purple">await</span>',
		'for': '<span class="purple">for</span>',
		'while': '<span class="purple">while</span>',
		'true': '<span class="blue">true</span>',
		'false': '<span class="orange">false</span>',
		'new': '<span class="blue">new</span>',
		'String': '<span class="yellow">String</span>',
		'Object': '<span class="yellow">Object</span>',
		'console': '<span class="red">console</span>',
		'print': '<span class="blue">print</span>',
		'in': '<span class="blue">in</span>',
		'of': '<span class="blue">of</span>',
		'def': '<span class="green">def</span>',
		'import': '<span class="red">import</span>',
		'from': '<span class="red">from</span>',
		'default': '<span class="red">default</span>',
		'export': '<span class="red">export</span>',
	}

	let regex = new RegExp(Object.keys(keys).join('|'), 'g');
	return input.replace(regex, function(match) {
        return keys[match];
    });
	//return input.replace(/let/g, '<span class="let">let</span>')
}

export function emoji(input) {
	input = String(input)
	let keys = {
		'😂': '<span class="emoji emoj:tearsjoy" alt="😂"></span>',
		'🚬': '<span class="emoji emoj:cigar" alt="🚬"></span>',
		'🤣': '<span class="emoji emoj:joy" alt="🤣"></span>',
		'🥰': '<span class="emoji emoj:facehearts" alt="🥰"></span>',
		'😎': '<span class="emoji emoj:faceeye" alt="😎"></span>',
		'🤡': '<span class="emoji emoj:clown" alt="🤡"></span>',
		'😋': '<span class="emoji emoj:savoring" alt="😋"></span>',
		'🗿': '<span class="emoji emoj:moai" alt="🗿"></span>',
		'✨': '<span class="emoji emoj:dizzy" alt="✨"></span>',
		'🤔': '<span class="emoji emoj:thinkf" alt="🤔"></span>',
		'❤': '<span class="emoji emoj:heart" alt="❤"></span>',
		'💕': '<span class="emoji emoj:twohearts" alt="💕"></span>',
		'💞': '<span class="emoji emoj:revohearts" alt="💞"></span>',
		'💔': '<span class="emoji emoj:brokheart" alt="💔"></span>',
		'💦': '<span class="emoji emoj:sweatcum" alt="💦"></span>',
		'💨': '<span class="emoji emoj:smoke" alt="💨"></span>',
		'✅': '<span class="emoji emoj:check" alt="✅"></span>',
	}

	let regex = new RegExp(Object.keys(keys).join('|'), 'g');
	return input.replaceAll(regex, function(match) {
        return keys[match];
    });
	//return input.replace(/let/g, '<span class="let">let</span>')
}