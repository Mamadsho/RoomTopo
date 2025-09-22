export function addRoom(name){
    const newRoom = document.createElement('div');
    newRoom.className = 'room';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.name = 'room-name';
    textInput.value = name;
    newRoom.appendChild(textInput);

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.name = 'room-color';
    colorInput.value = '#ff8888';
    newRoom.appendChild(colorInput);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.disabled = false;
    delBtn.textContent = 'X';
    newRoom.appendChild(delBtn);

    const container = document.querySelector('#rooms-container');
    container.appendChild(newRoom);
    newRoom.idx = Array.from(newRoom.parentNode.children).indexOf(newRoom);

    newRoom.delBtn = delBtn;
    newRoom.nameInput = textInput;
    newRoom.colorInput = colorInput;

    return newRoom;
}