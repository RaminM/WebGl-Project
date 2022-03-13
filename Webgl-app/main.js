//Variables
//Shape counter
var counter = 0;
//List of the shapes in the scene
var scene_objects = []
// Set the eye point and the viewing volume
var mvpMatrix = new Matrix4();
var normalMatrix = new Matrix4(); // Transformation matrix for normals
// Retrieve <canvas> element
var canvas = document.querySelector('#glcanvas');
// Get the rendering context for WebGL
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
//if we dont have a gl context stop
if (!gl) {
  console.log('Failed to get the rendering context for WebGL');
}
//
//Vertex shader program
//
var VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec4 a_Normal;
attribute float a_size;

uniform mat4 u_MvpMatrix;
uniform mat4 u_NormalMatrix;
uniform mat4 transform_mat;

uniform vec3 u_LightColor;
uniform vec3 u_LightPosition;
uniform vec3 u_AmbientLight;

varying vec4 v_Color;

void main() {
  gl_Position = u_MvpMatrix * a_Position;
  gl_PointSize = a_size;
  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
  vec4 vertexPosition = transform_mat * a_Position;
  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));
  float nDotL = max(dot(normal, lightDirection), 0.0);
  vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;
  vec3 ambient = u_AmbientLight * a_Color.rgb;
  v_Color = vec4(diffuse + ambient, a_Color.a);
}`
//
// Fragment shader program
//
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec4 v_Color;
    void main() {
      gl_FragColor = v_Color;
}`;

// Initialize shaders
if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
  console.log('Failed to intialize shaders.');
}
// Get the storage location of a_Position, assign buffer and enable
var transform_mat_loc = gl.getUniformLocation(gl.program, 'transform_mat');
if (transform_mat_loc < 0) {
  console.log('Failed to get the storage location of a_Color');
}


var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
if (!u_MvpMatrix) {
  console.log('Failed to get the storage location of u_MvpMatrix');
}

var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

if (!u_LightColor || !u_LightPosition || !u_AmbientLight || !u_NormalMatrix) {
  console.log('Failed to get the storage location');
}

// Set the light color (white)
gl.uniform3f(u_LightColor, 1, 1, 1);
// Set the light direction (in the world coordinate)
gl.uniform3f(u_LightPosition, 2.0, 3.0, 5.0);
// Set the ambient light
gl.uniform3f(u_AmbientLight, 0.25, 0.25, 0.25);



mvpMatrix.setPerspective(35, 1, 1, 100);
mvpMatrix.lookAt(4, 3, 7, 0, 0, 0, 0, 1, 0);

// Pass the model view projection matrix to u_MvpMatrix
gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

// Specify the color for clearing <canvas>
gl.clearColor(0.0, 0.0, 0.0, 0.85);
gl.enable(gl.DEPTH_TEST);

// Clear <canvas>
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);




class ShapeObject {
  constructor(name, shape, scale, location, rotation, color) {
    this.name = name;
    this.shape = shape;
    this.scale = scale;
    this.location = location;
    this.rotation = rotation;
    this.tm = this.compute()
    this.color = color;
    this.default_obj = [location, scale, rotation, color]

  }
  compute() {
    var tranform_mat = new Matrix4();
    // Set the rotation matrix
    tranform_mat.setTranslate(this.location[0], this.location[1], this.location[2], 0, 1, 2);
    tranform_mat.scale(this.scale[0], this.scale[1], this.scale[2], 1);
    tranform_mat.rotate(this.rotation, 0, 0, 1);
    return tranform_mat;
  }
}

function AddShape() {
  var go = new ShapeObject(
    //name
    (document.getElementById("shapes").value).concat(counter),
    //shape
    document.getElementById("shapes").value,
    //scale
    [scaleSL.value, scaleSL.value, scaleSL.value],
    //location
    [document.getElementById("lx").value == 'rand' ? -1 + Math.random() * 2 : parseFloat(document.getElementById("lx").value),
    document.getElementById("ly").value == 'rand' ? -1 + Math.random() * 2 : parseFloat(document.getElementById("ly").value),
    document.getElementById("lz").value == 'rand' ? -1 + Math.random() * 2 : parseFloat(document.getElementById("lz").value)],
    //rotation
    rotateSL.value,
    [parseFloat(document.getElementById("redSL").value), parseFloat(document.getElementById("greenSL").value), parseFloat(document.getElementById("blueSL").value), 1]
  )
  scene_objects.push(go);
  counter++;

  Refresh();

}
function RemoveShape() {
  my_go = document.getElementById("shapeList").value
  for (var i = 0; i < scene_objects.length; i++) {
    if (scene_objects[i].name == my_go) {
      scene_objects.splice(i, 1)
    }
  }
  Refresh();

}
function RotateShape() {
  my_go = document.getElementById("shapeList").value
  for (var i = 0; i < scene_objects.length; i++) {
    if (scene_objects[i].name == my_go) {
      scene_objects[i].rotation = parseFloat(rotateSL.value)
    }
    scene_objects[i].tm = scene_objects[i].compute()
  }

  Refresh();
  document.getElementById("shapeList").value = my_go;

}
function MoveShapeX(){
  my_go = document.getElementById("shapeList").value

  for (var i = 0; i < scene_objects.length; i++) {
    if (scene_objects[i].name == my_go) {
      scene_objects[i].location[0] = parseFloat(lx.value)
    }
    scene_objects[i].tm = scene_objects[i].compute()
  }
  Refresh();
  document.getElementById("shapeList").value = my_go;
}
function MoveShapeY(){
  my_go = document.getElementById("shapeList").value

  for (var i = 0; i < scene_objects.length; i++) {
    if (scene_objects[i].name == my_go) {
      scene_objects[i].location[1] = parseFloat(ly.value)
    }
    scene_objects[i].tm = scene_objects[i].compute()
  }
  Refresh();
  document.getElementById("shapeList").value = my_go;
}
function ScaleShape(){
  my_go = document.getElementById("shapeList").value
  var def_scale = []
  for (var i = 0; i < scene_objects.length; i++) {
    if (scene_objects[i].name == my_go) {
      scene_objects[i].scale[0] = parseFloat(scaleSL.value)
      scene_objects[i].scale[1] = parseFloat(scaleSL.value)
      scene_objects[i].scale[2] = parseFloat(scaleSL.value)
    }
    scene_objects[i].tm = scene_objects[i].compute()
  }
  Refresh();
  document.getElementById("shapeList").value = my_go;
}
function ChangeColor() {
  my_go = document.getElementById("shapeList").value

  for (var i = 0; i < scene_objects.length; i++) {
    if (scene_objects[i].name == my_go) {
      scene_objects[i].color[0] = parseFloat(redSL.value)
      scene_objects[i].color[1] = parseFloat(greenSL.value)
      scene_objects[i].color[2] = parseFloat(blueSL.value)
    }
  }

  Refresh();
  document.getElementById("shapeList").value = my_go;
}
function SetDefault() {

  gl.clear(gl.COLOR_BUFFER_BIT);

  document.getElementById("shapeList").innerHTML = ""
  scene_objects.forEach(go => {


    go.location = go.default_obj[0]
    go.scale = go.default_obj[1]
    go.rotation = go.default_obj[2]
    go.color = go.default_obj[3]


    go.tm = go.compute()
    var go_opt = document.createElement("option")
    go_opt.innerHTML = go.name
    document.getElementById("shapeList").appendChild(go_opt)
    draw(gl, go)
  })
}
function Refresh() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  document.getElementById("shapeList").innerHTML = ""
  scene_objects.forEach(my_go => {
    var go_opt = document.createElement("option")
    go_opt.innerHTML = my_go.name
    document.getElementById("shapeList").appendChild(go_opt)
    draw(gl, my_go)
  });

    

}
function draw(gl, go) {
  gl.uniformMatrix4fv(transform_mat_loc, false, go.tm.elements);
  var mvp = new Matrix4()

  mvp.set(mvpMatrix).multiply(go.tm);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvp.elements);

  // Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
  normalMatrix.setInverseOf(go.tm);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);


  if (go.shape == 'Cube') {
    var n = initBuffersCube(gl, go.color);
    if (n < 0) {
      console.log('Failed to set the vertex information');
    }

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  } else if (go.shape == 'Cone') {
    var n = initBuffersCone(gl, go.color);
    if (n < 0) {
      console.log('Failed to set the vertex information');
    }

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);


  } else if (go.shape == 'Sphere') {
    var n = initBuffersSphere(gl, go.color);
    if (n < 0) {
      console.log('Failed to set the vertex information');
    }

    // Draw the cube(Note that the 3rd argument is the gl.UNSIGNED_SHORT)
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);


  } else if (go.shape == 'Pyramid') {

    var n = initBuffersPyramid(gl, go.color);
    if (n < 0) {
      console.log('Failed to set the vertex information');
    }

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);


  } else if (go.shape == 'Disc') {

    var n = initBuffersCirci(gl, go.color);
    if (n < 0) {
      console.log('Failed to set the vertex information');
    }

    gl.drawArrays(gl.TRIANGLE_FAN, 0, n + 2);
  
  
  } else if (go.shape == 'Plane') {

    var n = initBuffersPlane(gl, go.color);
    if (n < 0) {
      console.log('Failed to set the vertex information');
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
  }
}

// CUBE
function initBuffersCube(gl, color) {
  var r
  var g
  var b
  r = color[0]
  g = color[1]
  b = color[2]

  var vertices = new Float32Array([
    0.8, 0.8, 0.8, -0.8, 0.8, 0.8, -0.8, -0.8, 0.8, 0.8, -0.8, 0.8,     // front
    0.8, 0.8, 0.8, 0.8, -0.8, 0.8, 0.8, -0.8, -0.8, 0.8, 0.8, -0.8,     // right
    0.8, 0.8, 0.8, 0.8, 0.8, -0.8, -0.8, 0.8, -0.8, -0.8, 0.8, 0.8,     // up
    -0.8, 0.8, 0.8, -0.8, 0.8, -0.8, -0.8, -0.8, -0.8, -0.8, -0.8, 0.8, // left
    -0.8, -0.8, -0.8, 0.8, -0.8, -0.8, 0.8, -0.8, 0.8, -0.8, -0.8, 0.8, // down
    0.8, -0.8, -0.8, -0.8, -0.8, -0.8, -0.8, 0.8, -0.8, 0.8, 0.8, -0.8  // back
  ]);

  // Colors
  var colors = new Float32Array([
    r, g, b, r, g, b, r, g, b, r, g, b, // front
    r, g, b, r, g, b, r, g, b, r, g, b, // righ
    r, g, b, r, g, b, r, g, b, r, g, b, // up
    r, g, b, r, g, b, r, g, b, r, g, b, // lef
    r, g, b, r, g, b, r, g, b, r, g, b, // down
    r, g, b, r, g, b, r, g, b, r, g, b  // back
  ]);

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,     // front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,     // righ
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,     // up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // lef
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0  // back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // right
    8, 9, 10, 8, 10, 11,    // up
    12, 13, 14, 12, 14, 15,    // left
    16, 17, 18, 16, 18, 19,    // down
    20, 21, 22, 20, 22, 23     // back
  ]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3)) return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

// CONE
function initBuffersCone(gl, color) {

  var vertices_arr = []
  vertices_arr.push(0, 0, 0)
  for (var i = 0; i < 10; i++) {
    var x = Math.cos((i * Math.PI / 5))
    var z = Math.sin((i * Math.PI / 5))
    vertices_arr.push(x, 0, z)
  }

  i_end = vertices_arr.length
  for (var i = 3; i < i_end - 3; i += 3) {
    vertices_arr.push(vertices_arr[i], vertices_arr[i + 1], vertices_arr[i + 2])
    vertices_arr.push(vertices_arr[i + 3], vertices_arr[i + 4], vertices_arr[i + 5])
    vertices_arr.push(0, 3, 0)
  }


  vertices = new Float32Array(vertices_arr)

  var color_array = []
  var r
  var g
  var b
  r = color[0]
  g = color[1]
  b = color[2]

  for (var i = 0; i < vertices_arr.length; i += 3) {
    color_array.push(r, g, b)
  }

  colors = new Float32Array(color_array)

  var indices = new Uint8Array([       // Indices of the vertices
    0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5,
    0, 5, 6, 0, 6, 7, 0, 7, 8, 0, 8, 9,
    0, 9, 10, 0, 10, 1, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23,
    24, 25, 26, 27, 28, 29, 30, 31, 32,
    33, 34, 35, 36, 37, 38, 39, 40
  ]);


  var normal_list = []
  normal_list.push(0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0)
  for (var i = 33; i < vertices_arr.length; i += 9) {
    var p1 = [vertices_arr[i], vertices_arr[i + 1], vertices_arr[i + 2]]
    var p2 = [vertices_arr[i + 3], vertices_arr[i + 4], vertices_arr[i + 5]]
    var p3 = [vertices_arr[i + 6], vertices_arr[i + 7], vertices_arr[i + 8]]
    var v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]]
    var v2 = [p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2]]
    var cross = crossProduct(v1, v2)
    normal_list.push(-1 * cross[0], -1 * cross[1], -1 * cross[2], -1 * cross[0], -1 * cross[1], -1 * cross[2], -1 * cross[0], -1 * cross[1], -1 * cross[2])
  }



  function crossProduct(p1, p2) {
    var cross_P = []
    cross_P[0] = p1[1] * p2[2] - p1[2] * p2[1];
    cross_P[1] = p1[2] * p2[0] - p1[0] * p2[2];
    cross_P[2] = p1[0] * p2[1] - p1[1] * p2[0];
    // console.log("Cross",cross_P)
    return cross_P
  }

  // console.log("normal",normal)

  var normals = new Float32Array(normal_list)


  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer)
    return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;

  if (!initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal'))
    return -1;


  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  return indices.length;

  function initArrayBuffer(gl, data, num, type, attribute) {
    var buffer = gl.createBuffer();   // Create a buffer object
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
      console.log('Failed to get the storage location of ' + attribute);
      return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    return true;
  }
}

//Sphere
function initBuffersSphere(gl, color) {
  var r
  var g
  var b
  r = color[0]
  g = color[1]
  b = color[2]

  var SPHERE_DIV = 20;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var indices = [];
  var color_array = [];

  var color_array = []
  for (var i = 0; i < 520; i++) {

    color_array.push(r, g, b)
  }
  var colors = new Float32Array(color_array)


  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      positions.push(si * sj);  // X
      positions.push(cj);       // Y
      positions.push(ci * sj);  // Z

    }
  }
  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV + 1) + i;
      p2 = p1 + (SPHERE_DIV + 1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }


  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', new Float32Array(colors), gl.FLOAT, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(positions), gl.FLOAT, 3)) return -1;


  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return indices.length;

  function initArrayBuffer(gl, attribute, data, type, num) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
      console.log('Failed to get the storage location of ' + attribute);
      return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;
  }
}

//SQUARE PYRAMID
function initBuffersPyramid(gl, color) {
  vertices_array = [
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, //down
    0.0, 1.5, 0.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, //front
    0.0, 1.5, 0.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, //right
    0.0, 1.5, 0.0, -1.0, -1.0, 1.0, -1.0, -1.0, -1.0, //left
    0.0, 1.5, 0.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, //back
  ]
  vertices = new Float32Array(vertices_array)

  var color_array = []
  var r
  var g
  var b
  r = color[0]
  g = color[1]
  b = color[2]

  for (var i = 0; i < 16; i++) {
    color_array.push(r, g, b)
  }

  colors = new Float32Array(color_array)

  var indices = new Uint8Array([       // Indices of the vertices
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 7, 8, 9,
    10, 11, 12, 13, 14, 15,
  ]);

  function crossProd(vec1, vec2) {
    var crossP = []
    crossP.push((vec1[1] * vec2[2] - vec1[2] * vec2[1]))
    crossP.push((vec1[2] * vec2[0] - vec1[0] * vec2[2]))
    crossP.push((vec1[0] * vec2[1] - vec1[1] * vec2[0]))
    return crossP
  }

  var normals1 = []

  normals1.push(0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0)
  for (var i = 12; i < vertices_array.length; i += 9) {
    var p1 = [vertices_array[i], vertices_array[i + 1], vertices_array[i + 2]]
    var p2 = [vertices_array[i + 3], vertices_array[i + 4], vertices_array[i + 5]]
    var p3 = [vertices_array[i + 6], vertices_array[i + 7], vertices_array[i + 8]]
    var v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]]
    var v2 = [p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2]]
    var cross = crossProd(v1, v2)
    normals1.push(-1 * cross[0], -1 * cross[1], -1 * cross[2], -1 * cross[0], -1 * cross[1], -1 * cross[2], -1 * cross[0], -1 * cross[1], -1 * cross[2])
  }


  var normals = new Float32Array(normals1)

  var indexBuffer = gl.createBuffer();
  if (!indexBuffer)
    return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;
  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;
  if (!initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal'))
    return -1;

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;

  function initArrayBuffer(gl, data, num, type, attribute) {
    var buffer = gl.createBuffer();   // Create a buffer object
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
      console.log('Failed to get the storage location of ' + attribute);
      return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    return true;
  }
}

// Plane
function initBuffersPlane(gl, color) {

  var r
  var g
  var b
  r = color[0]
  g = color[1]
  b = color[2]
  var verticesColors = new Float32Array([
    // Vertex coordinates and color
    -1, 1, 0.0, r, g, b,
    -1, -1, 0.0, r, g, b,
    1, 1, 0.0, r, g, b,
    1, -1, 0.0, r, g, b,
  ]);
  var n = 4;

  var normals = new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
  ]);

  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3)) return -1;

  // // Write the vertex coordinates and colors to the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_size_loc = gl.getAttribLocation(gl.program, 'a_size');
  if (a_size_loc < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_size_loc, 1, gl.FLOAT, false, FSIZE * 6, FSIZE * 2);
  gl.enableVertexAttribArray(a_size_loc);  // Enable the assignment of the buffer object

  return n;
}

//Circle
function initBuffersCirci(gl, color) {

  var n = 30;
  var r
  var g
  var b
  r = color[0]
  g = color[1]
  b = color[2]

  var verticesColors = new Float32Array((n + 2) * 6)

  verticesColors[0] = 0.0
  verticesColors[1] = 0.0
  verticesColors[2] = 10.0
  verticesColors[3] = r
  verticesColors[4] = g
  verticesColors[5] = b

  for (var i = 1; i < n + 2; i++) {
    verticesColors[i * 6] = 1 * Math.cos(2 * Math.PI * i / n)
    verticesColors[i * 6 + 1] = 1 * Math.sin(2 * Math.PI * i / n)
    verticesColors[i * 6 + 2] = 10.0 + Math.random() * 20.0
    verticesColors[i * 6 + 3] = r
    verticesColors[i * 6 + 4] = g
    verticesColors[i * 6 + 5] = b
  }

  var normal = [];
  for (i = 0; i < 32; i++) {
    normal.push(0)
    normal.push(0)
    normal.push(1)
  }
  var normals = new Float32Array(normal);

  if (!initArrayBuffer(gl, 'a_Normal', normals, 3)) return -1;

  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Write the vertex coordinates and colors to the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_size_loc = gl.getAttribLocation(gl.program, 'a_size');
  if (a_size_loc < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_size_loc, 1, gl.FLOAT, false, FSIZE * 6, FSIZE * 2);
  gl.enableVertexAttribArray(a_size_loc);  // Enable the assignment of the buffer object

  return n;
}

function initArrayBuffer(gl, attribute, data, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}












