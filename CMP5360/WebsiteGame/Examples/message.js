//variable in ES 5
var x=1;
var isClicked=true;

//variable in ES 6
let i =0;
const name ="Xi ";
const age=100;

//ES 5
function fname(){
    alert("This is function");
}

//ES 6
const message=() =>{
    const stringname ="This is a test function";
    return stringname + age;
}

export{name, age};
export default message;