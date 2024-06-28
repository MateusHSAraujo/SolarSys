// Mapeamento de Texturas 

import * as THREE           from 'three';
import { OrbitControls }    from './Assets/scripts/three.js/examples/jsm/controls/OrbitControls.js';
import { GUI } from './Assets/scripts/three.js/examples/jsm/libs/lil-gui.module.min.js';
import { EffectComposer } from './Assets/scripts/three.js/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './Assets/scripts/three.js/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass} from './Assets/scripts/three.js/examples/jsm/postprocessing/UnrealBloomPass.js';
import { configs_Planets } from './configs.js'; // Importando arquivo de configuração de planetas


const 	gui 	= new GUI();
const 	clock   = new THREE.Clock();
var composer ;

var     renderer,
        scene,
        camera,
        cameraControl,
        controls;

var sun_orbits = {};
var earth_orbit = {};

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

function main() {

    // Inicialização da scena e do renderizador 
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xFFFFFF, 1.0);
    renderer.setSize(window.innerWidth*1, window.innerHeight*1);
    renderer.shadowMap.enabled = true;                 // Habilitando mapa de sombras  
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // Configurando algoritmo de sombreamento

    document.body.appendChild(renderer.domElement);     // Inserindo renderizador no html

    // Configurando a câmera
    camera                  = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.x       = 0;
    camera.position.y       = 1000;
    camera.position.z       = 500;
    
    // Configurando controle orbital
    cameraControl           = new OrbitControls(camera, renderer.domElement);
    cameraControl.enablePan = true;

    // Configurando effect composer para gerar efeito de bloom
    composer  = new EffectComposer(renderer);                           // Compositor principal
    const renderPass = new RenderPass(scene,camera);                    // Filtro que renderiza a cena normal
    const bloomPass = new UnrealBloomPass(                              // Filtro de bloom para luz solar
            new THREE.Vector2( window.innerWidth, window.innerHeight ), 
            2,    // strength
            1.5,      // radius
            0.6   // threshold
        );
    
    composer.addPass(renderPass);   // Adicionando filtro de renderização normal no compositor
    composer.addPass(bloomPass);    // Adicionando filtro bloom no compositor
    
    
    // Carregando background e planetas
    loadBG();
    loadPLanets();
    
    // Configurando luz ambiente
    var ambientLight    = new THREE.AmbientLight(0x222222);
    ambientLight.name   = 'ambient';
    scene.add(ambientLight);

    // Configurando luz do sol
    var sunLight = new THREE.PointLight(0xffffff, 1.5,1000);
    sunLight.position.set( 0, 0, 0 )
    sunLight.name = 'sunLight';
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Inicialização da GUI e execução de animação
    initGUI();
    render();
}

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

// Função para carregamento geral dos corpos celestes da cena
function loadPLanets(){
    // Iniciando loader de texturas
    var textureLoader   = new THREE.TextureLoader();
    textureLoader.path = configs_Planets.textFolder_path; // Definindo caminho para texturas

    // Iteração sobre todos os planetas definidos no arquivo de configuração
    for (let planet_name in configs_Planets.planets){
        let planet_obj = configs_Planets.planets[planet_name]   // Gerando objeto com configuração do planeta
        
        if (planet_name == 'Sun'){  // Para o sol, chamamos uma função de carregamento especial
            loadSun(planet_obj,textureLoader);
            continue;
        }; 

        let sun_orbit = new THREE.Object3D();  // Gerando objeto que identifica a órbita solar do planeta
        generateSunOrbitRing(planet_name)      // Gerando anéis de órbita solar
        
        switch(planet_name){
            case 'Venus': // No caso de Vênus, chamamos uma função de carregamento especial (para também carregar suas nuvens)
                loadVenus(sun_orbit,textureLoader)
                break
            case 'Earth': // No caso da terra, chamamos uma função de carregamento especial (para também carregar a lua e suas nuvens)
                loadEarth(sun_orbit,textureLoader)
                break
            case 'Saturn': // No caso da saturno, chamamos uma função de carregamento especial (para também carregar seu anel)
                loadSaturn(sun_orbit,textureLoader); 
                break
            default:// No caso dos demais planetas
                let planet_mesh = generatePlanetMesh(planet_name,textureLoader) // Gera malha do planeta
                sun_orbit.add(planet_mesh) // Adiciona malha do planeta no grupo de sua órbita solar
                sun_orbits[planet_name] = sun_orbit // Adiciona órbita solar no objeto global que armazena essar órbitas
                scene.add(sun_orbit);   // Adiciona objetos do grupo da órbita na cena
                break
        }
        
    }

}

// Função para gerar anéis de órbita solar
function generateSunOrbitRing(planet_name){
    let planet_obj = configs_Planets.planets[planet_name]   // Gerando objeto de configuração do planeta
    let orbit_ring = new THREE.Mesh(                        // Gerando anel de órbita solar
        new THREE.RingGeometry( planet_obj.coords.x-0.125, planet_obj.coords.x+0.125, 250 ),    // Geometria de anel com espessura mínima
        new THREE.LineDashedMaterial( {  color: 0xffffff,           // Material do anel de órbita solar
                                        side: THREE.DoubleSide,
                                        transparent: true,
                                        opacity:0.3  } )
    );
    orbit_ring.rotateX(-Math.PI/2); // Rotacionando anel de órbita solar para ficar no sentido da trasnlação do planeta
    orbit_ring.name = 'orbit_ring'  // Definindo um nome padrão para todo anel de órbita
    orbit_ring.visible = true       // Anéis de órbita iniciam ligados
    scene.add(orbit_ring);          // Adicionando anel na cena
}

// Função para gerar a malha de um planeta qualquer a partir de seu nome configurado no arquivo de configurações
function generatePlanetMesh(planet_name,textureLoader){
    let planet_obj = configs_Planets.planets[planet_name]       // Gerando objeto de configuração do planeta
    let planet_mesh = new THREE.Mesh ( 
        new THREE.SphereGeometry(planet_obj.radius, 60, 60),    // Geramos uma esfera com o raio configurado no arquivo de configuração
        new THREE.MeshPhongMaterial({map:textureLoader.load(planet_obj.texturePath)}) // Geramos a textura com o mapa cujo caminho é definido no arquivo de configuração
    );
    planet_mesh.castShadow = true;      // Habilita emissão de sombras
    planet_mesh.receiveShadow = true;   // Habilita recepção de sombras
    planet_mesh.name = planet_name      // Configura nome da malha do planeta
    planet_mesh.rotateY(planet_obj.rotation)    // Configura rotação inicial definida no arquivo de configurações
    planet_mesh.position.set(planet_obj.coords.x,planet_obj.coords.y,planet_obj.coords.z)   // Desloca o planeta para sua posição inicial (também definida no arquivo de confiugrações)
    return planet_mesh
}

// Função para carregamento específico do sol
function loadSun(planet_obj,textureLoader){
    // Gerando malha 
    let planet_mesh = new THREE.Mesh (  
        new THREE.SphereGeometry(planet_obj.radius, 60, 60),    // Esfera com raio definido no arquivo de configurações
        new THREE.MeshBasicMaterial({map:textureLoader.load(planet_obj.texturePath),    // Material com textura cujo caminho é definido no arquivo de configuração
            transparent : true  // O sol deve ser transparente para que a luz emitida pelo ponto dentro dele atinja os demais planetas
        }) 
    );
    planet_mesh.name = 'Sun'    // Define nome da malha

    // Configurando malha do fogo solar 
    let fire_mesh = new THREE.Mesh(
        new THREE.SphereGeometry(planet_obj.radius+0.5, 60, 60),    // Esfera com raio definido no arquivo de configurações
        new THREE.ShaderMaterial({
            vertexShader: document.getElementById('sunFireVertexShader').textContent,     // Vertex shader customizado para permitir fragment shader customizado
            fragmentShader: document.getElementById('sunFireFragmentShader').textContent, // Fragment shader que gera ruído que se assemelha à oscilação luminosa solar  
            uniforms: {
                time: { value : 0.0, type:"f"}
            },
            transparent: true,                       // Transparente para que a luz do interior atravesse a malha 
            blending     :   THREE.AdditiveBlending, // Mescla aditiva para combinar o ruído gerado à textura do sol já existente 
        })
    )
    fire_mesh.name = 'sun_fire'
    planet_mesh.add(fire_mesh)  // Malha adicionada no próprio sol por que o efeito final fica melhor assim

    scene.add(planet_mesh)      // Adiciona malha na cena
}

function loadVenus(sun_orbit,textureLoader){
    let planet_obj = configs_Planets.planets.Venus  // Obtendo as configurações de Venus
    let planet_mesh = generatePlanetMesh('Venus',textureLoader) // Gerando malha do planeta
    sun_orbit.add(planet_mesh)  // Adicionando malha do planeta no objeto de sua órbita solar

    let clouds_mesh = new THREE.Mesh(   // Gerando malha para nuvens
        new THREE.SphereGeometry(planet_obj.radius+0.1, 60, 60),    // Geometria esférica com raio pouco maior que a do planeta
        new THREE.MeshPhongMaterial({
            map:textureLoader.load(planet_obj.clouds.texturePath),
            transparent  :   true,
            opacity      :   0.8,
            blending     :   THREE.AdditiveBlending 
        }) // Material com textura cujo caminho é definido no arquivo de configuração
    )
    clouds_mesh.position.set(planet_obj.coords.x,planet_obj.coords.y,planet_obj.coords.z)
    clouds_mesh.name = 'venus_clouds'
    sun_orbit.add(clouds_mesh)       // Adicionando malha das nuvens à órbita do planeta para que elas transladem o sol junto do planeta

    sun_orbits['Venus'] = sun_orbit; // Adicionando órbita solar de Venus ao objeto que guarda essas órbitas
    scene.add(sun_orbit)             // Adicionando tudo à cena
}

// Função para carregamento epecífico da terra
function loadEarth(sun_orbit,textureLoader){
    let planet_obj = configs_Planets.planets.Earth  // Obtendo as configurações da terra
    let planet_mesh = generatePlanetMesh('Earth',textureLoader) // Gerando malha do planeta
    sun_orbit.add(planet_mesh)  // Adicionando malha do planeta terra no objeto de sua órbita solar

    earth_orbit = new THREE.Object3D();     // Gerando objeto para agrupar malhas que orbitam a terra
    let moon_mesh = new THREE.Mesh (        // Gerando malha da lua
        new THREE.SphereGeometry(planet_obj.moon.radius, 60, 60), // Esfera com raio definido no arquivo de configurações
        new THREE.MeshPhongMaterial({map:textureLoader.load(planet_obj.moon.texturePath)}) // Material com textura cujo caminho é definido no arquivo de configuração
    );
    moon_mesh.position.set(planet_obj.moon.coords.x,planet_obj.moon.coords.y,planet_obj.moon.coords.z) // Posicionando objeto de acordo com o cofigurado no arquivo de configuração
    moon_mesh.castShadow = true;    // Habilitando emissão de sombras
    moon_mesh.receiveShadow = true; // Habilitando recpção de sombras
    moon_mesh.name='moon'           // Definindo nome da malha
    
    earth_orbit.add(moon_mesh)  // Adicionamos a malha da lua na malha de órbita da terra para que, ao rotacionar esta, aquela translade o planeta
    earth_orbit.rotateZ(-0.05)  // Inclinando levemente o eixo de translação da lua por que fica mais legal assim =)
    earth_orbit.position.set(planet_obj.coords.x,planet_obj.coords.y,planet_obj.coords.z)   // Deslocando o objeto de órbita da terra para as mesmas coordenadas definidas no arquivo de configuração
    earth_orbit.name = 'earth_orbit' // Definindo nome da malha de órbita da terra
    sun_orbit.add(earth_orbit)  // Adicionando objeto de órbita terrestre no objeto de órbita solar da terra para que, quando este rotacionar, aquele aparente transladar o sol conforme faz a terra
    
    let orbit_ring = new THREE.Mesh( // Gerando malha de anel de órbita terrestre
        new THREE.RingGeometry( planet_obj.moon.coords.x-0.075, planet_obj.moon.coords.x+0.075, 60 ),
        new THREE.MeshBasicMaterial( { color: 0xffffff, 
                                        side: THREE.DoubleSide,
                                        transparent: true,
                                        opacity:0.3 } )
    );
    orbit_ring.rotateX(-Math.PI/2); // Rotacionando anel de órbita terrestre para ficar no sentido da trasnlação do planeta
    orbit_ring.name = 'orbit_ring'  // Definindo um nome padrão para todo anel de órbita
    orbit_ring.visible = true
    earth_orbit.add(orbit_ring)     // Adicionamos o anel de órbita à órbita terrestre para que ele acompanhe a translação do planeta

    let clouds_mesh = new THREE.Mesh(   // Gerando malha para nuvens terrestres
        new THREE.SphereGeometry(planet_obj.radius+0.1, 60, 60),    // Geometria esférica com raio pouco maior que a terra
        new THREE.MeshPhongMaterial({
            map:textureLoader.load(planet_obj.clouds.texturePath),
            transparent  :   true,
            opacity      :   0.8,
            blending     :   THREE.AdditiveBlending 
        }) // Material com textura cujo caminho é definido no arquivo de configuração
    )
    clouds_mesh.position.set(planet_obj.coords.x,planet_obj.coords.y,planet_obj.coords.z)
    clouds_mesh.name = 'earth_clouds'
    sun_orbit.add(clouds_mesh)


    sun_orbits['Earth'] = sun_orbit; // Adicionando órbita solar da terra ao objeto que guarda essas órbitas
    scene.add(sun_orbit)             // Adicionando tudo à cena
}

function loadSaturn(sun_orbit,textureLoader){
    let planet_obj = configs_Planets.planets.Saturn  // Obtendo as configurações da terra
    let planet_mesh = generatePlanetMesh('Saturn',textureLoader) // Gerando malha do planeta

    // Produzindo a geometria do anel de saturno
    let ringsGeom = new THREE.RingGeometry( planet_obj.rings.radius, 35, 60 );  
    var pos = ringsGeom.attributes.position;
    var v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++){
        v3.fromBufferAttribute(pos, i);
        ringsGeom.attributes.uv.setXY(i, v3.length() < 26 ? 0 : 1, 1);
    }
    
    // Gerando malha dos aneis de saturno
    let rings_mesh = new THREE.Mesh (   ringsGeom,
        new THREE.MeshPhongMaterial( {  map         : textureLoader.load(planet_obj.rings.texturePath), // Malha com textura cujo caminho é definido no arquivo de configuração
            transparent : true,
            side        : THREE.DoubleSide })
        );
    rings_mesh.name='saturn_rings'         // Definindo nome da malha
    rings_mesh.castShadow = false;         // Desabilitando emissão de sombras pois elas deixam a textura falhada
    rings_mesh.receiveShadow = true;       // Habilitando recepção de sombras
    rings_mesh.rotateX(-Math.PI/2)         // Rotacionando os anéis para ficarem paralelos às faixas da textura do planeta
    planet_mesh.add(rings_mesh)            // Adicionando anéis à malha do planeta
    planet_mesh.rotateZ(0.3)               // Inclinando o conjunto por que assim fica mais legal =)
    sun_orbit.add(planet_mesh)             // Adicionando conjunto à órbita solar do planeta
    sun_orbits['Saturn'] = sun_orbit       // Adicionando órbita ao conjunto dos demais
    scene.add(sun_orbit);                  // Adicionando conjunto final à cena
}

// Função para carregamento da textura de background
function loadBG() {
    const path          = "../../Assets/Textures/Cubemaps/Space/blue/";
    const textCubeMap   =    [  path + "bkg1_right.png", 
                                path + "bkg1_left.png",
                                path + "bkg1_top.png", 
                                path + "bkg1_bot.png",
                                path + "bkg1_front.png", 
                                path + "bkg1_back.png"
                            ];

    const textureCube       = new THREE.CubeTextureLoader().load( textCubeMap );
    scene.background        = textureCube;

}
/// ***************************************************************
/// **                                                           **
/// ***************************************************************

// Função para inicialização da GUI
function initGUI(){
    controls = 	{	Camera_style: "Orbit",  // Campo para configuração do tipo de câmera
                    Camera_target: "Sun",   // Campo para configuração do alvo da câmera
                    Orbits: true    };      // Campo para ligar/desligar anéis de órbita

    gui.add( controls, 'Camera_style', ["Orbit","Centered","POV"] ).onChange(updateOrbitControls);
    gui.add(controls,'Camera_target',['Sun','Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune']).onChange(updateOrbitControlsTarget)
    gui.add(controls, 'Orbits').onChange(updateOrbits);
    gui.open();
}

// Função para atualizar visibilidade dos aneis conforme selecionado pelo usuário
function updateOrbits(value){
    scene.traverse((objectMesh) => {
        if (objectMesh.name == 'orbit_ring'){
            objectMesh.visible = value;
        }
    })
}

// Função para trocar os tipos de câmera 
function updateOrbitControls(){
    if (controls.Camera_style == 'Orbit'){ // No modo de órbita, liberamos o controle orbital, porém sempre com centro no sol
        cameraControl.enablePan = true;
        cameraControl.enableZoom = true;
        cameraControl.enableRotate = true;
        cameraControl.target = new THREE.Vector3(0,0,0);
    
        let r = configs_Planets.planets[controls.Camera_target].radius; // Distância do planeta
        let targetMesh = scene.getObjectByName(controls.Camera_target);
        let newCamPos = targetMesh.parent.localToWorld(   // Obtém as posições globais da câmera baseado nas posições referentes ao objeto desejadas
            new THREE.Vector3(
                targetMesh.position.x+r*10,
                targetMesh.position.y+r,
                targetMesh.position.z+r*10

            ))
        camera.position.x = newCamPos.x
        camera.position.y = newCamPos.y
        camera.position.z = newCamPos.z



    } else {    // Nos demais caso, desabilitamos o controle orbital para não gerar tremulação na câmera
        cameraControl.enablePan = false;
        cameraControl.enableZoom = false;
        cameraControl.enableRotate = false;
    }
}

function updateOrbitControlsTarget(){
    if(controls.Camera_style != 'Orbit') return;
    let r = configs_Planets.planets[controls.Camera_target].radius; // Distância do planeta
        let targetMesh = scene.getObjectByName(controls.Camera_target);
        let newCamPos = targetMesh.parent.localToWorld(   // Obtém as posições globais da câmera baseado nas posições referentes ao objeto desejadas
            new THREE.Vector3(
                targetMesh.position.x+r*10,
                targetMesh.position.y+r,
                targetMesh.position.z+r*10

            ))
        camera.position.x = newCamPos.x
        camera.position.y = newCamPos.y
        camera.position.z = newCamPos.z
}
/// ***************************************************************
/// **                                                           **
/// ***************************************************************

// Função que gera a animação
function render() {
    requestAnimationFrame(render); // Requisita próximo frame de animação
    
    if(controls.Camera_style == 'Orbit'){
        cameraControl.update();
    }
    let targetMesh = scene.getObjectByName(controls.Camera_target);
    let aux = new THREE.Vector3().copy(camera.position)
    let camera_last_localCoords = targetMesh.parent.worldToLocal(aux) 

    // Atualizando órbitas solares
    for(let name in sun_orbits){
        let objectMesh =  sun_orbits[name]                  // Obtém a malha da órbita planetária
        let planet_config = configs_Planets.planets[name]   // Obtém as configurações do planeta cuja malha corresponde
        
        // Rotaciona a malha de órbita com ângulo proporcional a velocidade de translação do planeta definido no arquivo de configuração.
        // Isso gera a impressão de que o planeta está transladando o sol.
        objectMesh.rotateY(planet_config.trans_vel)

        // Rotaciona a própria malha planetária com ângulo proporcional à velocidade de rotação do planeta definido no arquivo de configuração.
        // Isso simula o fenômeno de rotação do planeta.
        objectMesh.children[0].rotateY(planet_config.rot_vel)
    }
    
    animateSun()

    animateEarthAssets()

    cameraAnimate(camera_last_localCoords,targetMesh) // Função dedicada para animação da câmera

    //renderer.render(scene,camera); // Atualiza cena
    composer.render();
};

function animateSun(){
    // Obtém a malha do sol e a rotaciona para simular a rotação do sol
    let sun_mesh = scene.getObjectByName('Sun');
    sun_mesh.rotateY(0.0005)

    // Para atualizar a malha do fogo solar, precisamos atualizar o uniform de seu material e fazê-la rotacionar
    let fire_mesh = sun_mesh.children[0]
    let elapsedTime = clock.getElapsedTime()
    fire_mesh.material.uniforms.time.value =  (elapsedTime);  // O uniform time é quem permite a oscilação da textura que gera o fogo solar ao longo do tempo 
    fire_mesh.material.uniformsNeedUpdate = true;
    fire_mesh.updateMatrix();
    fire_mesh.rotation.x+=0.002*Math.sin(elapsedTime*0.8);
    fire_mesh.rotation.y+=0.002*Math.cos(elapsedTime*0.4);
    fire_mesh.rotation.z+=0.002*Math.sin(elapsedTime*0.2);
}


function animateEarthAssets(){
    // Obtém a malha da órbita terrestre e a rotaciona, gerando o efeito de revolução da lua em torno da terra
    earth_orbit.rotateY(0.05)
    earth_orbit.children[0].rotateY(0.05)   // Também rotaciona a malha da própria lua
    
    // Obtém a malha das nuvens terrestre e as rotaciona
    let clouds_mesh = scene.getObjectByName('earth_clouds') 
    clouds_mesh.rotateY(configs_Planets.planets['Earth'].clouds.rot_vel)
}

// Função dedicada para animar o movimento da câmera
function cameraAnimate(camera_last_localCoords,bodyMesh){
    
    // Obtém o vetor com as coordenadas globais dessa malha
    let bodyWP = new THREE.Vector3()
    bodyMesh.getWorldPosition(bodyWP)

    // Se o modo da camera for orbital, só atualizamos o controle
    if(controls.Camera_style == 'Orbit'){
        bodyMesh.parent.localToWorld(camera_last_localCoords)
        camera.position.x = camera_last_localCoords.x
        camera.position.y = camera_last_localCoords.y
        camera.position.z = camera_last_localCoords.z
        cameraControl.target = bodyWP
        camera.lookAt(bodyWP)
        return;
    }

    if (controls.Camera_style == 'Centered'){ // No modo centralizado, a câmera acompanha o alvo sempre 
        // Se o modo da câmera for centralizado, precisamos deslocar a câmera para uma posição próxima ao alvo
        camera.lookAt(bodyWP)
        let r = configs_Planets.planets[controls.Camera_target].radius; // Distância do planeta
        
        let elapsedTime = clock.elapsedTime;    // Obtém o tempo atual
        clock.getDelta();

        let newCamPos = bodyMesh.parent.localToWorld(   // Obtém as posições globais da câmera baseado nas posições referentes ao objeto desejadas
            new THREE.Vector3(
                bodyMesh.position.x+(r*10*Math.cos(0.1*elapsedTime)),// Configuramos a câmera para que ela fique orbitando em torno do planeta enquanto
                bodyMesh.position.y+(r*Math.cos(0.5*elapsedTime)),   // este orbita em torno do sol. As velocidades e distância da órbita nos três eixos
                bodyMesh.position.z+(r*10*Math.sin(0.1*elapsedTime)) // são distintas para melhorar a visualização.

            ))
        camera.position.x = newCamPos.x
        camera.position.y = newCamPos.y
        camera.position.z = newCamPos.z
        
    } else{
        // Se o modo da câmera for POV, precisamos deslocar a câmera para dentro do alvo
        camera.lookAt(0,0,0)
        camera.position.x = bodyWP.x ;
        camera.position.y = bodyWP.y ;
        camera.position.z = bodyWP.z ;
    }
}

/// ***************************************************************
/// ***************************************************************
/// ***************************************************************

main();
