import * as gl from './webglVoronoi.js';
import * as sv from './svgVoronoi.js';
import * as ht from './htmlVoronoi.js';
import { hexToRgb } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {

const sites = [];
const colors = [];

// canvas setup
const canvas = document.getElementById('canvas');
const svg = document.getElementById('voronoi-sites-svg');
const rooms_container = document.getElementById('rooms-container');
// Initialize Voronoi rendering
gl.init(canvas);
sv.initSVG(canvas, sites, ()=>{
    gl.update(sites, colors);
});

class Room{
    name;
    svg;
    dom;

    constructor(name){
        this.name = name;
        this.dom = ht.addRoom(name);
        colors.push(hexToRgb(this.dom.colorInput.value));
        sites.push([0.0, 0.0]);

        this.svg = sv.addRoom("Room", canvas.width / 2, canvas.height / 2);
        gl.update(sites, colors);

        this.dom.colorInput.addEventListener('input',()=>{
            colors[this.getId()] = hexToRgb(this.dom.colorInput.value);
            gl.update(sites, colors);
        });

        this.dom.delBtn.addEventListener('click', ()=>{
            let id = this.getId();
            sites.splice(this.getId(), 1);
            colors.splice(this.getId(), 1);
            sv.removeRoom(this.getId());
            gl.update(sites, colors);
            this.dom.remove();
        });
    }

    getId(){
        return Array.from(rooms_container.children).indexOf(this.dom);
    }
}

const r1 = new Room("Комната 1");

const addRoomBtn = document.querySelector('#add-room-button');
addRoomBtn.addEventListener('click', () => {
    new Room("Комната " + (sites.length + 1));
});

});