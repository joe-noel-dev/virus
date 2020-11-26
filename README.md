Virus Modelling
===============

To build:
---------

```
npm install
npm run build
open dist/index.html
```

Features
--------

- 'People' are in four different states: susceptible (white), infected (yellow), recovered (green), dead (red)
- Susceptible people can become infected when they close proximity to an infected person, or by passing through the 'hotspot' zone (red square)
- Infected people will eventually realise they are infected and self-isolate (they will stop moving and lose the white square)
- Infected people will eventually either recover or die
- Recovered people will eventually become susceptible
- Masks lower the chance of infection, the amount of people wearing masks and the effectiveness of masks can be changed with a slider
- A lockdown can be triggered. This will reduce movement.
- An 'Eat out to help out' can be triggered. This will create zones where people are more likely to congregate

