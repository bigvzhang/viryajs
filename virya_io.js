//
// Copyright (c) 2019-2020 Vic Zhang(VicBig at qq dot com)
//
// Distributed under the GNU General Public License, Version 3.(Please see
// more information at https://www.gnu.org/licenses/)
//
// Official repository: https://github.com/bigvzhang/viryajs
//

/* global window, exports, define */
!function(){ // wrap function

'use strict'

var re = {
	not_string: /[^s]/,
	not_bool: /[^t]/,
	not_type: /[^T]/,
	not_primitive: /[^v]/,
	number: /[diefg]/,
	numeric_arg: /[bcdiefguxX]/,
	json: /[j]/,
	not_json: /[^j]/,
	text: /^[^\x25]+/,
	modulo: /^\x25{2}/,
	placeholder: /^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,
	key: /^([a-z_][a-z_\d]*)/i,
	key_access: /^\.([a-z_][a-z_\d]*)/i,
	index_access: /^\[(\d+)\]/,
	sign: /^[+-]/
}

function sprintf(key) {
	// `arguments` is not an array, but should be fine for this call
	return sprintf_format(sprintf_parse(key), arguments)
}

function vsprintf(fmt, argv) {
	return sprintf.apply(null, [fmt].concat(argv || []))
}

function sprintf_format(parse_tree, argv) {
	var cursor = 1, tree_length = parse_tree.length, arg, output = '', i, k, ph, pad, pad_character, pad_length, is_positive, sign
	for (i = 0; i < tree_length; i++) {
		if (typeof parse_tree[i] === 'string') {
			output += parse_tree[i]
		}
		else if (typeof parse_tree[i] === 'object') {
			ph = parse_tree[i] // convenience purposes only
			if (ph.keys) { // keyword argument
				arg = argv[cursor]
				for (k = 0; k < ph.keys.length; k++) {
					if (arg == undefined) {
						throw new Error(sprintf('[sprintf] Cannot access property "%s" of undefined value "%s"', ph.keys[k], ph.keys[k-1]))
					}
					arg = arg[ph.keys[k]]
				}
			}
			else if (ph.param_no) { // positional argument (explicit)
				arg = argv[ph.param_no]
			}
			else { // positional argument (implicit)
				arg = argv[cursor++]
			}

			if (re.not_type.test(ph.type) && re.not_primitive.test(ph.type) && arg instanceof Function) {
				arg = arg()
			}

			if (re.numeric_arg.test(ph.type) && (typeof arg !== 'number' && isNaN(arg))) {
				throw new TypeError(sprintf('[sprintf] expecting number but found %T', arg))
			}

			if (re.number.test(ph.type)) {
				is_positive = arg >= 0
			}

			switch (ph.type) {
				case 'b':
					arg = parseInt(arg, 10).toString(2)
					break
				case 'c':
					arg = String.fromCharCode(parseInt(arg, 10))
					break
				case 'd':
				case 'i':
					arg = parseInt(arg, 10)
					break
				case 'j':
					arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0)
					break
				case 'e':
					arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential()
					break
				case 'f':
					arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg)
					break
				case 'g':
					arg = ph.precision ? String(Number(arg.toPrecision(ph.precision))) : parseFloat(arg)
					break
				case 'o':
					arg = (parseInt(arg, 10) >>> 0).toString(8)
					break
				case 's':
					arg = String(arg)
					arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
					break
				case 't':
					arg = String(!!arg)
					arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
					break
				case 'T':
					arg = Object.prototype.toString.call(arg).slice(8, -1).toLowerCase()
					arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
					break
				case 'u':
					arg = parseInt(arg, 10) >>> 0
					break
				case 'v':
					arg = arg.valueOf()
					arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
					break
				case 'x':
					arg = (parseInt(arg, 10) >>> 0).toString(16)
					break
				case 'X':
					arg = (parseInt(arg, 10) >>> 0).toString(16).toUpperCase()
					break
			}
			if (re.json.test(ph.type)) {
				output += arg
			}
			else {
				if (re.number.test(ph.type) && (!is_positive || ph.sign)) {
					sign = is_positive ? '+' : '-'
					arg = arg.toString().replace(re.sign, '')
				}
				else {
					sign = ''
				}
				pad_character = ph.pad_char ? ph.pad_char === '0' ? '0' : ph.pad_char.charAt(1) : ' '
				pad_length = ph.width - (sign + arg).length
				pad = ph.width ? (pad_length > 0 ? pad_character.repeat(pad_length) : '') : ''
				output += ph.align ? sign + arg + pad : (pad_character === '0' ? sign + pad + arg : pad + sign + arg)
			}
		}
	}
	return output
}

var sprintf_cache = Object.create(null)

function sprintf_parse(fmt) {
	if (sprintf_cache[fmt]) {
		return sprintf_cache[fmt]
	}

	var _fmt = fmt, match, parse_tree = [], arg_names = 0
	while (_fmt) {
		if ((match = re.text.exec(_fmt)) !== null) {
			parse_tree.push(match[0])
		}
		else if ((match = re.modulo.exec(_fmt)) !== null) {
			parse_tree.push('%')
		}
		else if ((match = re.placeholder.exec(_fmt)) !== null) {
			if (match[2]) {
				arg_names |= 1
				var field_list = [], replacement_field = match[2], field_match = []
				if ((field_match = re.key.exec(replacement_field)) !== null) {
					field_list.push(field_match[1])
					while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
						if ((field_match = re.key_access.exec(replacement_field)) !== null) {
							field_list.push(field_match[1])
						}
						else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
							field_list.push(field_match[1])
						}
						else {
							throw new SyntaxError('[sprintf] failed to parse named argument key')
						}
					}
				}
				else {
					throw new SyntaxError('[sprintf] failed to parse named argument key')
				}
				match[2] = field_list
			}
			else {
				arg_names |= 2
			}
			if (arg_names === 3) {
				throw new Error('[sprintf] mixing positional and named placeholders is not (yet) supported')
			}

			parse_tree.push(
				{
					placeholder: match[0],
					param_no:    match[1],
					keys:        match[2],
					sign:        match[3],
					pad_char:    match[4],
					align:       match[5],
					width:       match[6],
					precision:   match[7],
					type:        match[8]
				}
			)
		}
		else {
			throw new SyntaxError('[sprintf] unexpected placeholder')
		}
		_fmt = _fmt.substring(match[0].length)
	}
	return sprintf_cache[fmt] = parse_tree
}


function print(format, content){
	console.log(vsprintf(format, content));
}

function printf(format, content){
	process.stdout.write(vsprintf(format, content));
}

function DRAW_LINE(c = '=', l = 60) {
	console.log(c.repeat(l));
}

function EXPLAIN(s){
	console.log("// " + s);
}

function type(obj){
    return Object.prototype.toString.call(obj).slice(8, -1);
}

function print_obj_type(s,obj){ 
	console.log(s+type(obj));
}

function print_obj(obj, name_width=20){ // print content of an object
	if(type(obj) == "Undefined"){
		print("The object is undefined!");
		return;
	}
	if(obj == null){
		print("The object is null!");
		return;
	}
	let names = Object.getOwnPropertyNames(obj);
	if(names.length == 0){
		print("The object:" + obj);
		return ;
	}
	// the object has properties
	print("The object has %d properties:", [names.length]);
	names.forEach(
		function(name,idx,array){
			var type_ = type(obj[name]);
			switch(type_){
			case "String": print(" Prop:%-"+name_width+"s Value:\"%s\"",[name, obj[name] != null ?  obj[name] : "null"]);  break
			case "Boolean": 
			case "Number": print(" Prop:%-"+name_width+"s Value:%s",[name, obj[name] != null ?  obj[name] : "null"]);
				break;
			default:	
				print(" Prop:%-"+name_width+"s Type :%s",[name, type(obj[name])]);
			}
		}
	);
}

function print_obj_prop(obj, name_width=20){ // print object's property names and their type
	if(type(obj) == "Undefined"){
		print("The object is undefined!");
		return;
	}
	if(obj == null){
		print("The object is null!");
		return;
	}
	Object.getOwnPropertyNames(obj).forEach(
		function(name,idx,array){
			print("Name:%-"+name_width+"s Type:%s",[name, type(obj[name])]);
		}
	);
}


/**
 * export to either browser or node.js
 */
/* eslint-disable quote-props */
if (typeof exports !== 'undefined') {
	exports.sprintf  = sprintf
	exports.vsprintf = vsprintf
	exports.print    = print;
	exports.printf    = printf;
	exports.print_obj = print_obj;
	exports.print_obj_prop = print_obj_prop;
	exports.print_obj_type = print_obj_type;
	exports.DRAW_LINE = DRAW_LINE;
	exports.EXPLAIN   = EXPLAIN;
}
/* uncomment the following if you want to use them in document
if (typeof window !== 'undefined') {
	window.sprintf  = sprintf
	window.vsprintf = vsprintf
	window.print    = print;
	window.printf    = printf;
	window.print_obj = print_obj;
	window.print_obj_prop = print_obj_prop;
	window.print_obj_type = print_obj_type;
	window.DRAW_LINE = DRAW_LINE;
	window.EXPLAIN   = EXPLAIN;
	if (typeof define === 'function' && define['amd']) {
		define(function() {
			return {
				sprintf  : sprintf,
				vsprintf : vsprintf,
				print    : print,
				printf    : printf,
				print_obj : print_obj,
				print_obj_prop : print_obj_prop,
				print_obj_type : print_obj_type,
				DRAW_LINE : DRAW_LINE,
				EXPLAIN   : EXPLAIN
			}
		})
	}
}
*/

}(); // wrap

