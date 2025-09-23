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

export function addLink(rooms){
    const newLink = document.createElement('div');
    newLink.className = 'link';

    const roomASelect = document.createElement('select');
    roomASelect.name = 'room-a';
    newLink.appendChild(roomASelect);

    newLink.appendChild(document.createTextNode(' -> '));
    
    const roomBSelect = document.createElement('select');
    roomBSelect.name = 'room-b';
    newLink.appendChild(roomBSelect);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.disabled = false;
    delBtn.textContent = 'X';
    newLink.appendChild(delBtn);

    const container = document.querySelector('#links-container');
    container.appendChild(newLink);

    // Populate room options
    rooms.forEach((room) => {
        const opt = document.createElement('option');
        opt.value = room.idx;
        opt.textContent = room.name;
        roomASelect.appendChild(opt);
        roomBSelect.appendChild(opt.cloneNode(true));
    });
    roomASelect.value = rooms[0]? rooms[0].idx :'';
    roomBSelect.value = rooms[0]? rooms[0].idx : '';

    newLink.roomASelect = roomASelect;
    newLink.roomBSelect = roomBSelect;
    newLink.delBtn = delBtn;

    return newLink;
}