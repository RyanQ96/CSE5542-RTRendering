/**
 * Utility functions for parsing OBJ files. Borrowed from https://webglfundamentals.org/webgl/webgl-load-obj-w-mtl-w-normal-maps.html
 */

import { subtractVector, scaleVector, normalizeVector } from "./matrix";


export function parseOBJ(text: any): any {
	// because indices are base 1 let's just fill in the 0th data
	const objPositions = [[0, 0, 0]];
	const objTexcoords = [[0, 0]];
	const objNormals = [[0, 0, 0]];
	const objColors = [[0, 0, 0]];

	// same order as `f` indices
	const objVertexData = [
		objPositions,
		objTexcoords,
		objNormals,
		objColors,
	];

	// same order as `f` indices
	let webglVertexData = [
		[],   // positions
		[],   // texcoords
		[],   // normals
		[],   // colors
	];

	const materialLibs = [];
	const geometries = [];
	let geometry;
	let groups = ['default'];
	let material = 'default';
	let object = 'default';

	const noop = () => { };

	function newGeometry() {
		// If there is an existing geometry and it's
		// not empty then start a new one.
		if (geometry && geometry.data.position.length) {
			geometry = undefined;
		}
	}

	function setGeometry() {
		if (!geometry) {
			const position = [];
			const texcoord = [];
			const normal = [];
			const color = [];
			webglVertexData = [
				position,
				texcoord,
				normal,
				color,
			];
			geometry = {
				object,
				groups,
				material,
				data: {
					position,
					texcoord,
					normal,
					color,
				},
			};
			geometries.push(geometry);
		}
	}

	function addVertex(vert) {
		const ptn = vert.split('/');
		ptn.forEach((objIndexStr, i) => {
			if (!objIndexStr) {
				return;
			}
			const objIndex = parseInt(objIndexStr);
			const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
			webglVertexData[i].push(...objVertexData[i][index]);
			// if this is the position index (index 0) and we parsed
			// vertex colors then copy the vertex colors to the webgl vertex color data
			if (i === 0 && objColors.length > 1) {
				geometry.data.color.push(...objColors[index]);
			}
		});
	}

	const keywords = {
		v(parts) {
			// if there are more than 3 values here they are vertex colors
			if (parts.length > 3) {
				objPositions.push(parts.slice(0, 3).map(parseFloat));
				objColors.push(parts.slice(3).map(parseFloat));
			} else {
				objPositions.push(parts.map(parseFloat));
			}
		},
		vn(parts) {
			objNormals.push(parts.map(parseFloat));
		},
		vt(parts) {
			// should check for missing v and extra w?
			objTexcoords.push(parts.map(parseFloat));
		},
		f(parts) {
			setGeometry();
			const numTriangles = parts.length - 2;
			for (let tri = 0; tri < numTriangles; ++tri) {
				addVertex(parts[0]);
				addVertex(parts[tri + 1]);
				addVertex(parts[tri + 2]);
			}
		},
		s: noop,    // smoothing group
		mtllib(parts: any, unparsedArgs: any) {
			// the spec says there can be multiple filenames here
			// but many exist with spaces in a single filename
			parts
			materialLibs.push(unparsedArgs);
		},
		usemtl(parts: any, unparsedArgs) {
			parts
			material = unparsedArgs;
			newGeometry();
		},
		g(parts) {
			parts
			groups = parts;
			newGeometry();
		},
		o(parts: any, unparsedArgs) {
			parts
			object = unparsedArgs;
			newGeometry();
		},
	};

	const keywordRE = /(\w*)(?: )*(.*)/;
	const lines = text.split('\n');
	for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
		const line = lines[lineNo].trim();
		if (line === '' || line.startsWith('#')) {
			continue;
		}
		const m = keywordRE.exec(line);
		if (!m) {
			continue;
		}
		const [, keyword, unparsedArgs] = m;
		const parts = line.split(/\s+/).slice(1);
		const handler = keywords[keyword];
		if (!handler) {
			console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
			continue;
		}
		handler(parts, unparsedArgs);
	}

	// remove any arrays that have no entries.
	for (const geometry of geometries) {
		geometry.data = Object.fromEntries(
			Object.entries(geometry.data).filter(([, array]) => (array as any).length > 0));
	}

	return {
		geometries,
		materialLibs,
	};
}


export function parseMTL(text: any): any {
	const materials = {};
	let material;

	const keywords = {
		newmtl(parts, unparsedArgs) {
			parts
			material = {};
			materials[unparsedArgs] = material;
		},
		/* eslint brace-style:0 */
		Ns(parts) { material.shininess = parseFloat(parts[0]); },
		Ka(parts) { material.ambient = parts.map(parseFloat); },
		Kd(parts) { material.diffuse = parts.map(parseFloat); },
		Ks(parts) { material.specular = parts.map(parseFloat); },
		Ke(parts) { material.emissive = parts.map(parseFloat); },
		map_Kd(parts, unparsedArgs) { parts; material.diffuseMap = parseMapArgs(unparsedArgs); },
		map_Ns(parts, unparsedArgs) { parts; material.specularMap = parseMapArgs(unparsedArgs); },
		map_Bump(parts, unparsedArgs) { parts; material.normalMap = parseMapArgs(unparsedArgs); },
		Ni(parts) { parts; material.opticalDensity = parseFloat(parts[0]); },
		d(parts) { parts; material.opacity = parseFloat(parts[0]); },
		illum(parts) { parts; material.illum = parseInt(parts[0]); },
	};

	const keywordRE = /(\w*)(?: )*(.*)/;
	const lines = text.split('\n');
	for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
		const line = lines[lineNo].trim();
		if (line === '' || line.startsWith('#')) {
			continue;
		}
		const m = keywordRE.exec(line);
		if (!m) {
			continue;
		}
		const [, keyword, unparsedArgs] = m;
		const parts = line.split(/\s+/).slice(1);
		const handler = keywords[keyword];
		if (!handler) {
			console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
			continue;
		}
		handler(parts, unparsedArgs);
	}

	return materials;
}

export function parseMapArgs(unparsedArgs) {
	// TODO: handle options
	return unparsedArgs;
}


export function create1PixelTexture(gl: WebGLRenderingContext, pixel: number[]) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
		new Uint8Array(pixel));
	return texture;
}


export function createTexture(gl: WebGLRenderingContext, url: string, finishTexture: CallableFunction | null) {
	const texture = create1PixelTexture(gl, [128, 192, 255, 255]);
	// Asynchronously load an image
	const image = new Image();
	requestCORSIfNotSameOrigin(image, url)
	image.src = url;
	image.addEventListener('load', function () {
		// Now that the image has loaded make copy it to the texture.
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		// Check if the image is a power of 2 in both dimensions.
		if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
			// Yes, it's a power of 2. Generate mips.
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			// No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}

		if (finishTexture) {
			finishTexture(texture);
		}

	});
	return texture;
}

function requestCORSIfNotSameOrigin(img: any, url: string) {
	if ((new URL(url, window.location.href)).origin !== window.location.origin) {
		img.crossOrigin = "";
	}
}

export function isPowerOf2(value: number) {
	return (value & (value - 1)) === 0;
}

export function makeIndexIterator(indices: number[]) {
	let ndx = 0;
	const fn = () => indices[ndx++];
	fn.reset = () => { ndx = 0; };
	fn.numElements = indices.length;
	return fn;
}

export function makeUnindexedIterator(positions: number[]) {
	let ndx = 0;
	const fn = () => ndx++;
	fn.reset = () => { ndx = 0; };
	fn.numElements = positions.length / 3;
	return fn;
}

export function generateTangents(position: number[], texcoord: number[], indices: number[] | null = null) {
	const getNextIndex = indices ? makeIndexIterator(indices) : makeUnindexedIterator(position);
	const numFaceVerts = getNextIndex.numElements;
	const numFaces = numFaceVerts / 3;

	const tangents = [];
	for (let i = 0; i < numFaces; ++i) {
		const n1 = getNextIndex();
		const n2 = getNextIndex();
		const n3 = getNextIndex();

		const p1 = position.slice(n1 * 3, n1 * 3 + 3);
		const p2 = position.slice(n2 * 3, n2 * 3 + 3);
		const p3 = position.slice(n3 * 3, n3 * 3 + 3);

		const uv1 = texcoord.slice(n1 * 2, n1 * 2 + 2);
		const uv2 = texcoord.slice(n2 * 2, n2 * 2 + 2);
		const uv3 = texcoord.slice(n3 * 2, n3 * 2 + 2);

		const dp12 = subtractVector(p2, p1);
		const dp13 = subtractVector(p3, p1);

		const duv12 = subtractVector(uv2, uv1);
		const duv13 = subtractVector(uv3, uv1);

		const f = 1.0 / (duv12[0] * duv13[1] - duv13[0] * duv12[1]);
		const tangent = Number.isFinite(f)
			? normalizeVector(scaleVector(subtractVector(
				scaleVector(dp12, duv13[1]),
				scaleVector(dp13, duv12[1]),
			), f))
			: [1, 0, 0];

		tangents.push(...tangent, ...tangent, ...tangent);
	}

	return tangents;
}


function getExtents(positions) {
	const min = positions.slice(0, 3);
	const max = positions.slice(0, 3);
	for (let i = 3; i < positions.length; i += 3) {
		for (let j = 0; j < 3; ++j) {
			const v = positions[i + j];
			min[j] = Math.min(v, min[j]);
			max[j] = Math.max(v, max[j]);
		}
	}
	return { min, max };
}

export function getGeometriesExtents(geometries) {
	return geometries.reduce(({ min, max }, { data }) => {
		const minMax = getExtents(data.position);
		return {
			min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
			max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
		};
	}, {
		min: Array(3).fill(Number.POSITIVE_INFINITY),
		max: Array(3).fill(Number.NEGATIVE_INFINITY),
	});
}

export function setBuffersAndAttributes(gl: WebGLRenderingContext, setters, buffers) {
	setAttributes(setters, buffers.attribs);
	if (buffers.indices) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
	}
}

export function setUniforms(setters, ...values) {
	setters = setters.uniformSetters || setters;
	for (const uniforms of values) {
		Object.keys(uniforms).forEach(function (name) {
			const setter = setters[name];
			if (setter) {
				console.log(name)
				setter(uniforms[name]);
			}
		});
	}
}

function setAttributes(setters, attribs) {
	setters = setters.attribSetters || setters;
	Object.keys(attribs).forEach(function (name) {
		const setter = setters[name];
		if (setter) {
			console.log(name)
			setter(attribs[name]);
		}
	});
}


export function computeSurfaceNormals(verts, faces) {
	var surfaceNormals = new Float32Array(faces.length);
	// const npts = verts.length / 3;
	const ntris = faces.length / 3;
	for (var i = 0; i < ntris; i++) {
		var tri = [faces[i * 3], faces[i * 3 + 1], faces[i * 3 + 2]];
		// var tri = [faces[i*11+1], faces[i*11+2], faces[i*11+3]];
		var p0 = [verts[tri[0] * 3], verts[tri[0] * 3 + 1], verts[tri[0] * 3 + 2]];
		var p1 = [verts[tri[1] * 3], verts[tri[1] * 3 + 1], verts[tri[1] * 3 + 2]];
		var p2 = [verts[tri[2] * 3], verts[tri[2] * 3 + 1], verts[tri[2] * 3 + 2]];

		var u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
		var v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];

		surfaceNormals[i * 3] = u[1] * v[2] - u[2] * v[1];
		surfaceNormals[i * 3 + 1] = u[2] * v[0] - u[0] * v[2];
		surfaceNormals[i * 3 + 2] = u[0] * v[1] - u[1] * v[0];
	}
	return surfaceNormals;
}

export function computeVertexNormals(verts, faces, surfaceNormals) {
	var vertexNormals = new Float32Array(verts.length);
	const npts = verts.length / 3;
	const ntris = faces.length / 3;
	for (var i = 0; i < ntris; i++) {
		// var tri = [faces[i*11+1], faces[i*11+2], faces[i*11+3]];
		var tri = [faces[i * 3], faces[i * 3 + 1], faces[i * 3 + 2]];

		for (var t = 0; t < 3; t++) {
			for (var j = 0; j < 3; j++) {
				vertexNormals[tri[t] * 3 + j] = vertexNormals[tri[t] * 3 + j] + surfaceNormals[i * 3 + j];
			}
		}
	}
	for (var i = 0; i < npts; i++) {
		var n = [vertexNormals[i * 3], vertexNormals[i * 3 + 1], vertexNormals[i * 3 + 2]];
		var mag = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
		for (var j = 0; j < 3; j++)
			vertexNormals[i * 3 + j] = vertexNormals[i * 3 + j] / mag;
	}
	return vertexNormals;
}
