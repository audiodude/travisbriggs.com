---
title: Java
date: 2025-04-25
quality: Stub
importance: Low
---
The problem with Java is that everything has to be a class. Period point blank. This distorts all design of programs, because you start thinking "Well I can't have a function that just takes an object, so I better add it as a method of the object". Then you think, "Well my Object needs to be able to construct other Objects that it needs, but I don't want to tightly couple them" so you end up with a Factory pattern. Also, you end up trying to map classes to "real world-ish" things, like Databases and Business Models and such, even though some functionality cuts across class boundaries and would be better in just a simple funcion. Don't worry, we have the Singleton pattern for that, for basically just a loose colletion of random code. :facepalm:.