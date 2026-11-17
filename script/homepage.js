const funFacts = [
  "My all-time favourite character is Zane from Ninjago! 🥷🏻",
  "My least favourite foods are lasagna and roasted tomatoes!",
  "Go visit your local church! ⛪",
  "My favourite planets are Venus and Uranus!",
  "My favourite moon is Titan, Saturn's biggest moon!",
  "My favourite dwarf planets are Makemake and Haumea!",
  "Go read Shaun Tan's books: The Lost Thing, Rules of Summer, and The Arrival!",
  "My favourite superheroes are Spider-Man, Iron Man, and Violet from The Incredibles.",
  "My favourite jazz song is Betophone by Caravan Palace!",
  "My love languages are physical touch and gift giving!",
  "My favourite object show is ONE by Cheezyhfj!",
  "I would be in the house of Slytherin! 🐍",
  "I love spiders! My favourite tarantulas are the Pinktoe (Caribena versicolor) and the Gooty Sapphire (Poecilotheria metallica)!",
  "If I could have a superpower, it would be cell manipulation! 🧫",
  "My favourite cats are the black cat and calico cat! 😺",
  "Go watch the Among Us and Cuphead shows!",
  "My favourite colour is dark purple! 💜",
  "My favourite dinosaur is the Trilobite! 🦕",
  "My favourite Jack Stauber song is Fighter!",
  "I have ADHD and Autism! ✨",
  "I love seafood! 🐠🐟",
  "My favourite space movies are Project Hail Mary, Interstellar, Star Wars, and 2001: A Space Odyssey!",
  "My favourite element on the periodic table is bromine! [Br 35]",
  "My favourite mythical symbol is the Ouroboros! 🐍♾️",
  "My favourite mythical creatures are the Rainbow Serpent (Aboriginal Australian mythology) and the Kraken (Scandinavian folklore)!",
  "Jesus loves you more than Jupiter is big!",
  "My favourite Disney character is the Magic Carpet from Aladdin! 🧞",
  "My favourite mushroom is Mycena subcyanocephala, or the Blue Bonnet! 🍄",
  "My favourite flower is the stinking corpse lily (Rafflesia arnoldii)! 🌺",
  "I am a loud and proud Christian!",
  "One of my first original characters was a girl called Lucy who ran a sentient cafe in Paris! 🥖",
  "Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune could fit in the gap between the Earth and Moon! 🌎🌙",
  "I have dreams almost every night! 🌃"
];

const factTrigger = document.querySelector(".profile-fact-trigger");
const factBubble = document.querySelector("#fun-fact-bubble");
let factTimeout;

if (factTrigger && factBubble) {
  factTrigger.addEventListener("click", () => {
    factBubble.textContent = funFacts[Math.floor(Math.random() * funFacts.length)];
    factBubble.hidden = false;
    factTrigger.setAttribute("aria-expanded", "true");
    window.clearTimeout(factTimeout);
    factTimeout = window.setTimeout(() => {
      factBubble.hidden = true;
      factTrigger.setAttribute("aria-expanded", "false");
    }, 20000);
  });
}
