# The project includes some functions like print, print_obj; hopefully useful for you.

# Installation
```
git clone https://github.com/bigvzhang/viryajs
# set enviroment variable NODE_PATH to the download dir

```

# Functions in virya_io
## format functions
- sprintf
- vsprintf
```
Usage:
let s1 = sprintf('%2$s %3$s a %1$s', 'I'd', 'Love', 'the World!')
let s2 = vsprintf('A:%s, B:%s, C:%s and D:%s', ['a', 'b', 'c', 'd'])
```

## print functions
- print
- printf
- print_obj
- print_obj_prop
- print_obj_type
- DRAW_LINE
- EXPLAIN
```
Usage:
print ('%s, %s, %s and %s', ['a', 'b', 'c', 'd'])    // analogous to print in c
printf('%s, %s, %s and %s\n', ['a', 'b', 'c', 'd'])  // analogous to printf in c
print_obj(obj)  // print the object's properties and their values
print_obj_prop(obj) // print the object's properties
print_obj_type(obj) // print the object's type name
DRAW_LINE()         // print one horizontal line in the console
EXPALIN("THE NOTICE")  // results like => "//THE NOTICE"
```
