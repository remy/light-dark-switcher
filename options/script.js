const $ = (q) => document.querySelector(q);

document.body.addEventListener('input', (e) => {
  const node = e.target;
  if (node.nodeName !== 'INPUT') {
    return;
  }

  let value = node.value;
  if (node.type === 'text') {
    const useText = $(
      `input[type="radio"][name="${node.id}"][value="-"]`
    ).checked;

    if (useText) {
      browser.storage.local.set({
        [node.id || node.name]: value,
      });
      browser.runtime.sendMessage({
        update: 1,
      });
      return;
    }
  }

  if (node.type === 'radio') {
    if (node.value === '-') {
      // this is the "custom" select, so we need to read the text value
      value = $(`#${node.name}`).value;
    }

    browser.storage.local.set({
      [node.id || node.name]: value,
    });
    browser.runtime.sendMessage({
      update: 1,
    });
  }
});

init().catch((e) => {
  console.log(e.stack);
});

/**
 * boots the app and populates the themes
 */
async function init() {
  const extensions = await browser.management.getAll();

  const themeList = [];
  for (let extension of extensions) {
    if (extension.type !== 'theme') {
      continue;
    }

    const { name, id } = extension;
    themeList.push({ name, id });
  }

  const storage = await browser.storage.local.get(null);

  buildOptions('light', $('#light-box ul'), themeList, storage.light);
  buildOptions('dark', $('#dark-box ul'), themeList, storage.dark);
}

function buildOptions(prefix, node, themes, option) {
  let optionUsed = false;
  for (let i = 0; i < themes.length; i++) {
    const { id, name } = themes[i];

    let li = document.createElement('li');
    let selected = '';
    if (option === id || option === undefined) {
      if (optionUsed === false) {
        selected = `checked`;
        optionUsed = true;
      }
    }

    li.innerHTML = `<label><input ${selected} type="radio" value="${id}" name="${prefix}">${name}</label>`;
    node.appendChild(li);
  }

  let li = document.createElement('li');
  let selected = optionUsed === false ? `checked` : '';

  console.log({ [prefix]: option });

  li.innerHTML = `<label><input ${selected} type="radio" value="-" name="${prefix}">Custom</label><input id="${prefix}" type="text" value="${
    selected ? option : ''
  }" placeholder="https://color.firefox.com/?theme=...">`;
  node.appendChild(li);
}
