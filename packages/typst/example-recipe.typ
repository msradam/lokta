// Recipe variant. Compile: typst compile --font-path fonts example-recipe.typ
#import "lokta.typ": *

#show: lokta-recipe.with(
  title: "Dashi Broth",
  film: "Spirited Away",
  note: [Dashi is the spine of the Japanese kitchen: kombu and katsuobushi, drawn
    slowly so the stock stays clear. It carries every soup in this chapter.],
  meta: ("Yields 2½ cups", "Prep 10 min", "Cook 5 min", "Rest 2 hours"),
  ingredients: (
    "4-inch (10 cm) piece kombu",
    "1½ cups (20 g) katsuobushi",
    "2½ cups (600 ml) water",
  ),
  steps: (
    [Add the water and kombu to a saucepan. Let soak for 1 to 2 hours.],
    [Put the pan over medium-low heat and bring to almost boiling. Remove the kombu.],
    [Add the katsuobushi, remove from the heat, and steep for 5 minutes.],
    [Filter the broth through a conical strainer.],
  ),
)
