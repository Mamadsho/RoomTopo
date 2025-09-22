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
    sp.updateVoronoi(sites, [[-.95, -.95], [.95, -.95], [.95, .95], [-.95, .95]]);
});
sp.init(canvas);

class Room{
    name;
    svg;
    dom;

    constructor(name){
        this.name = name;
        this.dom = ht.addRoom(name);
        colors.push(hexToRgb(this.dom.colorInput.value));
        sites.push([0.0, 0.0]);

        this.svg = sc.addRoom(name, 0, 0);
        gl.update(sites, colors);
        const boundingPolygon = [[-.95, -.95], [.95, -.95], [.95, .95], [-.95, .95]];
        sp.updateVoronoi(sites, boundingPolygon);

        this.dom.nameInput.addEventListener('input',()=>{
            this.name = this.dom.nameInput.value;
            sc.updateRoomLabel(this.svg, this.name);
        });

        this.dom.colorInput.addEventListener('input',()=>{
            colors[this.getId()] = hexToRgb(this.dom.colorInput.value);
            gl.update(sites, colors);
        });

        this.dom.delBtn.addEventListener('click', ()=>{
            let id = this.getId();
            sites.splice(this.getId(), 1);
            colors.splice(this.getId(), 1);
            sc.removeRoom(this.getId());
            gl.update(sites, colors);
            gp.updateVoronoi(sites, boundingPolygon);
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