import * as gl from './webglVoronoi.js';
import * as sc from './svgVoronoiCentroids.js';
import * as ht from './htmlVoronoi.js';
import * as sp from './svgVoronoiPolygons.js';
import { hexToRgb } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {

const sites = [];
const colors = [];

// canvas setup
const canvas = document.getElementById('canvas');
const svg = document.getElementById('voronoi-centroids-svg');
const rooms_container = document.getElementById('rooms-container');
// Initialize Voronoi rendering
gl.init(canvas);
sc.initSVG(canvas, sites, ()=>{
    gl.update(sites, colors);
    Link.updateAll();
    sp.updateVoronoi(sites, Room.boundingPolygon);
});
sp.init(canvas);

class Room{
    static rooms = [];
    static count = 0;
    static maxId = 0;
    static boundingPolygon = [[-.35, -.95], [.95, -.95], [.35, .95], [-.95, .95]];
    idx;
    name;
    svg;
    dom;

    constructor(name){
        this.name = name;
        this.dom = ht.addRoom(name);
        colors.push(hexToRgb(this.dom.colorInput.value));
        sites.push([0.0, 0.0]);
        Room.rooms.push(this);
        this.idx = Room.maxId;
        Room.maxId++;
        Room.count++;

        this.svg = sc.addRoom(name, 0, 0);
        gl.update(sites, colors);
        sp.updateVoronoi(sites, Room.boundingPolygon);

        this.dom.nameInput.addEventListener('input',()=>{
            this.name = this.dom.nameInput.value;
            sc.updateRoomLabel(this.svg, this.name);
            Link.updateRoomName(this);
        });

        this.dom.colorInput.addEventListener('input',()=>{
            colors[this.getOrderNo()] = hexToRgb(this.dom.colorInput.value);
            gl.update(sites, colors);
        });

        this.dom.delBtn.addEventListener('click', ()=>{
            this.remove();
        });
    }

    remove(){
        const number = this.getOrderNo();
        Room.rooms.splice(number, 1);
        Room.count--;
        sites.splice(number, 1);
        colors.splice(number, 1);
        Link.removeRoom(this);
        sc.removeRoom(number);
        gl.update(sites, colors);
        sp.updateVoronoi(sites, Room.boundingPolygon);
        this.dom.remove();
    }

    getOrderNo(){
        return Room.rooms.indexOf(this);
    }

    static getById(idx){
        return Room.rooms.find(r => r.idx === idx);
    }
    
}

class Link{
    static links = [];
    roomA;
    roomB;
    dom;
    line;
    constructor(){
        Link.links.push(this);
        this.dom = ht.addLink(Room.rooms);
        this.line = sp.addLine([0,0], [0,0]);
        this.roomA = Room.getById(parseInt(this.dom.roomASelect.value));
        this.roomB = Room.getById(parseInt(this.dom.roomBSelect.value));
        this.dom.roomASelect.addEventListener('input',()=>{
            this.roomA = Room.getById(parseInt(this.dom.roomASelect.value));
            this.updateEnds();
        });
        this.dom.roomBSelect.addEventListener('input',()=>{
            this.roomB = Room.getById(parseInt(this.dom.roomBSelect.value));
            this.updateEnds();
        });
        this.dom.delBtn.addEventListener('click', ()=>{
            Link.links.splice(Link.links.indexOf(this), 1);
            this.line.remove();
            this.dom.remove();
        });
    }
    remove(){
        this.line.remove();
        this.dom.remove();
        Link.links.splice(Link.links.indexOf(this), 1);
    }
    updateEnds(){
        if (this.roomA && this.roomB){
            const a = sites[this.roomA.getOrderNo()];
            const b = sites[this.roomB.getOrderNo()];
            this.line.segment = [a, b];
            sp.updateLine(this.line);
        }
    }
    static updateAll(){
        Link.links.forEach((l)=>l.updateEnds());
    };
    static removeRoom(room){
        Link.links.filter(l => l.roomA === room || l.roomB === room).forEach(l => l.remove());
        Link.links.forEach((l)=>{
            [...l.dom.roomASelect.options, ...l.dom.roomBSelect.options].forEach((opt)=>{
                if (parseInt(opt.value) === room.idx)
                    opt.remove();
            });
        });
    }
    static addRoom(room){
        Link.links.forEach((l)=>{
            const optA = document.createElement('option');
            optA.value = room.idx;
            optA.textContent = room.name;
            l.dom.roomASelect.appendChild(optA);
            const optB = document.createElement('option');
            optB.value = room.idx;
            optB.textContent = room.name;
            l.dom.roomBSelect.appendChild(optB);
        });
    }
    static updateRoomName(room){
        Link.links.forEach((l)=>{
            [...l.dom.roomASelect.options, ...l.dom.roomBSelect.options].forEach((opt)=>{
                if (parseInt(opt.value) === room.idx)
                    opt.textContent = room.name;
            });
        });
    }
}

const r1 = new Room("Комната 1");

const addRoomBtn = document.querySelector('#add-room-button');
addRoomBtn.addEventListener('click', () => {
    let r = new Room("Комната " + (sites.length + 1));
    Link.addRoom(r);
});

const addLinkBtn = document.querySelector('#add-link-button');
addLinkBtn.addEventListener('click', () => {
    new Link();
});


window.Room = Room;
window.Link = Link;

// animate();

});

function animate(){

    const e = sp.addPolygon([
        [-0.5, -0.5],
        [-0.5, 0.5],
        [0.5, 0.5],
        [0.5, -0.5],
    ]);

    let start;
    function step(timestamp) {
        if (start === undefined) {
            start = timestamp;
        }
        const elapsed = timestamp - start;

        e.pts = [
            [Math.sin(0.003 * elapsed)*.5 , -0.5],
            [-0.5, Math.cos(0.003 * elapsed)*.5 ],
            [Math.cos(0.003 * elapsed)*.5 , 0.5],
            [0.5, Math.sin(0.003 * elapsed)*.5 ],
        ];
        sp.updatePolygon(e);
        requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}