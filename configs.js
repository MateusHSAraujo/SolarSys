const configs_Planets = {
    textFolder_path: "./Assets/Textures/solarSystem/2k-images/",
    planets:{
        Sun : {
            radius : 30,
            coords : {x:0,y:0,z:0},
            rotation: 0,
            texturePath: "2k_sun.jpg"
        },
        Mercury:{
            radius:2,
            coords : {x:100,y:0,z:0},
            rotation: 0.00059,
            trans_vel: 0.0172,
            rot_vel: 0.005,
            texturePath: "2k_mercury.jpg"
        },
        Venus:{
            radius:4,
            coords : {x:200,y:0,z:0},
            rotation: 3.096,
            trans_vel: 0.0126,
            rot_vel: 0.006,
            texturePath: "2k_venus_surface.jpg",
            clouds :{
                rot_vel : 0.01,
                texturePath: "2k_venus_atmosphere.jpg"
            }
        },
        Earth: {
            radius:5,
            coords : {x:300,y:0,z:0},
            rotation: 0.409,
            trans_vel: 0.0107,
            rot_vel: 0.009,
            texturePath: "2k_earth_daymap.jpg",
            moon: {
                        radius:1,
                        coords : {x:20,y:0,z:0},
                        rotation: 0.1,
                        texturePath: "2k_moon.jpg"
                    },
            clouds : {
                rot_vel : 0.013,
                texturePath: "earthcloudmapspec.jpg"
            }
            
        },
        Mars:{
            radius:3,
            coords : {x:400,y:0,z:0},
            rotation: 0.440,
            trans_vel: 0.0086,
            rot_vel: 0.004,
            texturePath: "2k_mars.jpg"
        },
        Jupiter:{
            radius:11,
            coords : {x:500,y:0,z:0},
            rotation: 0.055,
            trans_vel: 0.0046,
            rot_vel: 0.005,
            texturePath: "2k_jupiter.jpg"
        },
        Saturn:{
            radius:9,
            coords : {x:600,y:0,z:0},
            rotation: 0.1,
            trans_vel: 0.0034,
            rot_vel: 0.0054,
            texturePath: "2k_saturn.jpg",
            rings : {
                radius: 19,
                texturePath: "2k_saturn_ring_alpha.png"
            }
        },
        Uranus:{
            radius:8,
            coords : {x:700,y:0,z:0},
            rotation: 1.706,
            trans_vel: 0.0024,
            rot_vel: 0.0065,
            texturePath: "2k_uranus.jpg"
        },
        Neptune:{
            radius:7,
            coords : {x:800,y:0,z:0},
            rotation: 0.494,
            trans_vel: 0.0019,
            rot_vel: 0.0082,
            texturePath: "2k_neptune.jpg"
        }
    }
};

export {configs_Planets};