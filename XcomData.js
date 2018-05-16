const RIFLERANGES = {1:30,2:27,3:24,4:21,5:18,6:15,7:12,8:9,9:6,10:3,11:0,12:0,13:0,14:0,15:0,16:0,17:0,18:0,19:0,20:-5,21:-10,22:-15,23:-20,24:-25,"other":-30};
const SHOTGUNRANGES = {1:60,2:45,3:30,4:15,5:8,6:4,7:0,8:0,9:-4,10:-8,11:-16,12:-32,13:-40,14:-48,15:-60,16:-70,17:-80,18:-90,"other":-100};
const CANNONRANGES = {1:-10,2:-5,3:0,4:5,5:10,6:8,7:6,8:4,9:2,"other":0};
const SMGRANGES = {1:30,2:25,3:20,4:15,5:10,6:5,7:0,8:0,9:0,10:0,11:0,12:-4,13:-8,14:-12,15:-16,16:-20,17:-24,18:-30,19:-40,20:-50,21:-60,22:-70,23:-80,24:-90,"other":-100};
const SAWEDOFFRANGES = {1:60,2:30,4:-20,5:-40,6:-80,"other":-100};

const WEAPONLIST = {
    "assaultrifle":{"id":"assaultrifle","name":"Assault Rifle","damage":"2+1d3","critDamage":"2","noise":"Pop Pop Pop!","range":RIFLERANGES},
    "shotgun":{"id":"shotgun","name":"Shotgun","damage":"3+1d3","critChance":"15","critDamage":"2","noise":"KABOOM!","range":SHOTGUNRANGES},
    "beamrifle":{"id":"beamrifle","name":"Beam Rifle","damage":"2+1d3","critDamage":"2","noise":"Feeyoo Feeyoo!","range":RIFLERANGES},
    "adventrifle":{"id":"adventrifle","name":"Advent Rifle","damage":"1+1d3","critDamage":"2","noise":"Pew Pew!","range":RIFLERANGES},
    "sawedoffshotgun":{"id":"sawedoffshotgun","name":"Sawed-Off Shotgun","damage":"4+1d5","critChance":"15","critDamage":"2","noise":"KABOOM!","range":SAWEDOFFRANGES},
    "smg":{"id":"smg","name":"Submachine Gun","damage":"1+1d3","critDamage":"1","noise":"Pop Pop Pop!","range":SMGRANGES},
};

const ENEMYRANDSTATS = {
    "mk1trooper":{"attribute-health":[3,4],"attribute-will":[40,45,45,45]},
    "sectoid":{"attribute-health":[7,8,8,9], "attribute-will":[80,85,05,05], "attribute-aim":[70,75,75,75], "bonus-crit":[0,0,10,10], "attribute-psiOffense":[80,90,90,90]},
}

const MOBILITY = {
    1:{"blue":1,"yellow":1},
    2:{"blue":1,"yellow":1},
    3:{"blue":2,"yellow":2},
    4:{"blue":2,"yellow":3},
    5:{"blue":3,"yellow":3},
    6:{"blue":4,"yellow":4},
    7:{"blue":4,"yellow":5},
    8:{"blue":5,"yellow":5},
    9:{"blue":6,"yellow":6},
    10:{"blue":6,"yellow":7},
    11:{"blue":7,"yellow":7},
    12:{"blue":8,"yellow":8},
    13:{"blue":8,"yellow":9},
    14:{"blue":9,"yellow":9},
    15:{"blue":10,"yellow":10},
    16:{"blue":10,"yellow":11},
    17:{"blue":11,"yellow":11},
    18:{"blue":12,"yellow":12},
    19:{"blue":12,"yellow":13},
    20:{"blue":13,"yellow":13},
    21:{"blue":14,"yellow":14},
    22:{"blue":14,"yellow":15},
    23:{"blue":15,"yellow":15},
};
