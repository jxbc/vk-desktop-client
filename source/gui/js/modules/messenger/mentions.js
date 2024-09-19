let input = document.querySelector('.messanger_input .input')

export function parse(value, e) {
	let text = String(value)
	const textNodes = getTextNodes(e);
    const regex = /@\w+\b/g;

        textNodes.forEach(node => {
            const text = node.textContent;
            let match;

            while ((match = regex.exec(text)) !== null) {
                const startIndex = match.index;
                const endIndex = startIndex + match[0].length;

                const span = document.createElement('span');
                span.textContent = match[0];
                span.style.color = 'blue';

                const range = document.createRange();
                range.setStart(node, startIndex);
                range.setEnd(node, endIndex);
                range.deleteContents();
                range.insertNode(span);
            }
        });
}

function getTextNodes(element) {
        const textNodes = [];

        function getTextNodesRecursively(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node);
            } else {
                node.childNodes.forEach(getTextNodesRecursively);
            }
        }

        getTextNodesRecursively(element);
        return textNodes;
    }