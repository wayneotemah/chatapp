let objectList = [
  { username: "jdksdsa                   ", kil: "hey",jksd: " j        " },
  { name: "heyyyyyyyyyy              " },
];
let finalList = [];
objectList.forEach((object) => {
  let newObject = {};
  Object.entries(object).forEach(([key, value]) => {
    newObject[key] = value.trim();
  });
  finalList.push(newObject);
});

console.log(finalList);
