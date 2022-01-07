//# has-script
//# skip_to,4
log(0);
log(null);
log(0);
log(1);

//# replace,6,true
log('1');
log(2);


//# wait,10
const func = () => {
};
//# move_up,1
  console.log(1);
  console.log(2);
  console.log(3);
//# move_down,1
1+1;
2+2;
//# replace,10,true
log('2');
log(3);

//# replace,25,true
log('3');


