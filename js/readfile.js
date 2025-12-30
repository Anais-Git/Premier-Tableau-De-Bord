const sep = ';';

/* Renvoie sous forme d'une liste les valeurs contenues
 dans une chaîne de caractère en utilisant le séparateur
 défini en constante.
Param :   line : String
return :  values : list of String
*/
function getCsvValuesFromLine(line) {
    var values = line.split(sep);
    value = values.map(function(value){
        return value.replace(/\"/g, '');
    });
    return values;
}

/*Renvoie sous forme d'une liste d'Object
 (voir doc : Object key-values)les informations
 contenues dans un fichier CSV passé sous la forme
 d'une liste de chaînes de caractères.
Param :   lines : list of String
return :  people : list of String
*/
function getLinesFromHTML(lines){
  //on récupère la première ligne comme header et on la retire
  var headers = getCsvValuesFromLine(lines[0]);
  lines.shift();
  //On crée un tableau pour contenir les individus du dataset
  var people = [];
  for(var i=0; i<lines.length; i+=1){
    //chaque case est un Object rempli avec les paires clé/valeur
    people[i] = {};
    var lineValues = getCsvValuesFromLine(lines[i]);
    for (var j=0; j<lineValues.length; j+=1){
      people[i][headers[j]] = lineValues[j];
    }
  }
  return people;
}

//variable globale pour le contenu (texte) du CSV
var CSVcontent;

//Filereader pour le flux de lecture
const fileInput = document.getElementById('csv')
const readFile = () => {
  const reader = new FileReader()
  reader.onload = () => {
    CSVcontent = reader.result;
  }
  // lit le fichier et appelle l'événement "onload" ensuite
  reader.readAsText(fileInput.files[0])
}

//Définition de la fonction associé au bouton "load"
var btn = document.getElementById('load_btn');
btn.onclick = function() {
    var lines = CSVcontent.split('\n');
    // console.log(getCsvValuesFromLine(lines[0]));
    run(getLinesFromHTML(lines));
}

fileInput.addEventListener('change', readFile)
