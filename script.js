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

// generate random points
let points = [];
for (let i=0; i<5; i++){
    points.push([Math.random() - .5, Math.random() - .5]);
}

for (let i=0; i<points.length; i++){
    sp.addDot(points[i]);
    let pol = [[-.95, -.95], [.95, -.95], [.95, .95], [-.95, .95]];
    let vpol = sp.addPolygon(pol, "lightgrey");
    for (let j=0; j<points.length; j++){
        if (i !== j){
            const mid = sp.midline(points[i], points[j]);
            const cut_pol = sp.cutPolygon(pol, mid);
            if (cut_pol){
                if (sp.pointInPolygon(points[i], cut_pol[0])) {pol = cut_pol[0];}
                else {pol = cut_pol[1];}
                vpol.pts = pol;
                sp.updatePolygon(vpol);
            }
        }
    }
}


// const cl = sp.addLine([0,0], [.5, .8]);
// const pol = sp.addPolygon([[0,.3], [.3,0], [.7,.7], [.1, .6]]);
// sp.bisectPolygon(pol, cl);
// const d = sp.addDot([-.5, .5]);
// const d2 = sp.addDot([.3, .1]);
// sp.addLine(...sp.midline(d.c, d2.c));

// for (let i=0; i< pol.pts.length; i++){
//     let seg = [pol.pts[i], pol.pts[(i + 1)%pol.pts.length]];
//     if (sp.isIntersecting(cl.segment, seg)) {
//         const pl = sp.addLine(seg[0], seg[1], "teal");
//         sp.addDot(findIntersection(cl.segment, pl.segment));
//     }
// }

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