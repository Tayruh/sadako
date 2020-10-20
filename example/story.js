sadako.story = {"start":{"0":[{"t":"Welcome."},{"t":"enter_name","k":"=","l":"start.enter_name"},{"t":"Please tell me your name."},{"t":"<table><>"},{"t":"<tr><>"},{"t":"<td>[:> $.name @: <b>First</b><br>:]</td><>"},{"t":"<td>[:> $.lname @: <b>Last</b><br>:]</td><>"},{"t":"</tr><>"},{"t":"</table>"},{"t":"[:>> $.bleh @: <b>Favorite Foods</b> (not needed)<br>:]"},{"t":"[Continue]","k":"\\+"},{"t":"[:& $.demo_complete = false:]","k":"\\-"},{"t":"It's a pleasant rainy day outside. You're spending it indoors with your sister Erin."},{"t":">> #living_room"}],"labels":{"enter_name":["start","0",1],"y":["start","0.10",3]},"0.10":[{"t":"if (!$.name || !$.lname)","k":"~"},{"t":"[:& $.fname = \"$:name $:lname\":]","k":"\\-"},{"t":"Your name is $:fname. Is this correct?"},{"t":"[Yes]","k":"\\+","l":"start.y"},{"t":"[No]","k":"\\+"}],"0.10.0":[{"t":"Name is invalid."},{"t":">> enter_name"}],"0.10.4":[{"t":">> enter_name"}]},"inventory":{"0":[{"t":"[:= game.displayInventory():]"}]},"living_room":{"0":[{"t":"(:title \"Living Room\":)"},{"t":"<b><i>You've reached the end of the demo! Thanks for playing!</i></b>","c":"$.demo_complete"},{"t":"Your family isn't rich but they provide well enough, as is visible by this room. It comes with your usual furnishings like a [:% couch:] and a [:% television:]. In the middle of the room is a large circular [:% rug @: throw rug:]. The wall to the right of the couch houses a set of [:% windows:] overlooking the yard."},{"t":"[:erin @: Erin:] is here, seated comfortably on the throw rug and watching the TV."},{"t":"<< end"},{"t":"television","k":"=","l":"living_room.television"},{"t":"The TV is playing {:%.erin.talked::Erin's favorite show::some sort of anime:}."},{"t":"Voices coming from the TV: <:demo-tv::\"I was in an accident. I have amnesia!\":>"},{"t":"It seems like {:%.erin.talked::the relationship between Junji and Miren is getting deeper and::a very tropey show, but:} Erin looks like she's really invested in it."},{"t":"[Back]","k":"\\+","l":"living_room.tv_back"},{"t":"erin_watching","k":"=","l":"living_room.erin_watching"},{"t":"if (*.waiting_for_remote.hasEnded)","k":"~"},{"t":"","k":"\\-"},{"t":"<<"},{"t":"couch","k":"=","l":"living_room.couch"},{"t":"The couch isn't anything special, but it's very comfortable and faces TV at the perfect angle. Erin still prefers the floor, for whatever reason."},{"t":"if (%.living_room.searched_couch)","k":"~"},{"t":"elseif (*.waiting_for_remote.isActive)","k":"~"},{"t":"[Back]","k":"\\+","l":"living_room.couch_back"},{"t":"rug","k":"=","l":"living_room.rug"},{"t":"It's a large colorful rug. You have no idea what material it's made of, but it's very soft to the touch and it feels like you sink into it."},{"t":"Erin is currently appreciating its comfort."},{"t":">> go_back"},{"t":"windows","k":"=","l":"living_room.windows"},{"t":"The rain gently taps against the window pane. There's a light mist covering the yard."},{"t":"A bolt lightning lights up the sky. ~:delay:2000"},{"t":"A soft crackle of thunder can be heard moments later. ~:delay:3000"},{"t":"The rain begins to pound the window harder."},{"t":"~:delay:0"},{"t":"go_back","k":"=","l":"living_room.go_back"},{"t":"[Back]","k":"\\+","l":"living_room.gb"}],"labels":{"television":["living_room","0",5],"tv_back":["living_room","0",9],"erin_watching":["living_room","0",10],"couch":["living_room","0",14],"couch_back":["living_room","0",18],"rug":["living_room","0",19],"windows":["living_room","0",23],"go_back":["living_room","0",29],"gb":["living_room","0",30],"searched_couch":["living_room","0.17",1],"search_back":["living_room","0.17",2]},"0.9":[{"t":"<< return"}],"0.11":[{"t":"Erin is completely absorbed in her show and it doesn't look like she wants to be disturbed any further."},{"t":">> go_back"}],"0.16":[{"t":"You're pretty positive there's nothing else in the couch."}],"0.17":[{"t":"There's really only one place you can think of where the remote would be: in the black hole that is the space between the couch cushions."},{"t":"[Search couch]","k":"\\+","l":"living_room.searched_couch"},{"t":"[Back]","k":"\\+","l":"living_room.search_back"}],"0.17.1":[{"t":"(:move \"items\", \"remote\":)"},{"t":"You stick your hand between the cushions and reach deeper into the couch than you think should be possible, but eventually your hand rests upon what you imagine is the remote. You retrieve it and blow off the dust."},{"t":">> go_back"}],"0.17.2":[{"t":">> $:bookmark"}],"0.18":[{"t":"<< return"}],"0.30":[{"t":"<< return"}],"tags":{"room":true}},"erin":{"0":[{"t":">> living_room.erin_watching"},{"t":">> remote","c":"*.waiting_for_remote.isActive"},{"t":"Erin looks up at you. \"Hey, $:name.\""},{"t":"\"Hey, Erin.\"","k":"\\+"},{"t":"\"What you are watching?\"","k":"\\+"},{"t":"","k":"\\-"},{"t":"[Sit with Erin]","k":"\\+"},{"t":"\"No thanks. Maybe later.\"","k":"\\+"},{"t":"remote","k":"=","l":"erin.remote"},{"t":"(:bookmark \"remote\":)"},{"t":"\"Hey. Did you get the remote yet?\""},{"t":"go_back","k":"=","l":"erin.go_back"},{"t":"[Back]","k":"\\+","l":"erin.gb"}],"labels":{"remote":["erin","0",8],"go_back":["erin","0",11],"gb":["erin","0",12],"guess":["erin","0.6",5],"g1":["erin","0.6",6],"g2":["erin","0.6",7],"g3":["erin","0.6",8],"done_guessing":["erin","0.6",11],"talked":["erin","0.6",17]},"0.3":[{"t":"She pats a spot on the rug next to her. \"Come sit with me.\""}],"0.4":[{"t":"\"It's my show. It's starting to get really good, but it's commercials right now. Want to watch it with me?\""}],"0.6":[{"t":"You plop yourself down next to her."},{"t":"\"Nice.\" She smiles at you. \"I think you'll really enjoy this.\""},{"t":"\"What is this show even about?\"[] you ask.","k":"\\+"},{"t":"\"I think you told me about this one before.[\"] It's the one with the two mech pilots from warring nations that fall in love, right?\"","k":"\\+"},{"t":"<> She sighs. \"Junji is just so dreamy.\"","k":"\\-"},{"t":"guess","k":"=","l":"erin.guess"},{"t":"\"Is he the one with the eyepatch?\"","k":"\\*","l":"erin.g1"},{"t":"\"Does he have the shaved head?\"","k":"\\*","l":"erin.g2"},{"t":"\"Is he the one that wears the biker jacket?\"","k":"\\*","l":"erin.g3"},{"t":"","k":"\\*"},{"t":">> guess","k":"\\-"},{"t":"done_guessing","k":"=","l":"erin.done_guessing"},{"t":"<> She points at the at the TV now that the show has resumed. \"<i>That's</i> Junji.\""},{"t":"There's a young unassuming boy with black hair on the screen. He doesn't look familiar."},{"t":"\"Hmm. I don't recognize him.\"","k":"\\+"},{"t":"\"Yeah.. Sure. That guy.\"","k":"\\+"},{"t":"\"Yeah, whatever. I'm going to watch my show now.\" She waves you away.","k":"\\-"},{"t":"[Back]","k":"\\+","l":"erin.talked"}],"0.6.2":[{"t":"\"You don't remember me explaining it to you? Miren is from the moon and Junji is from Earth. They're both mech pilots and at war with each other, but they fall in love.\""}],"0.6.3":[{"t":"\"That's the one!\""}],"0.6.6":[{"t":"\"That's Gemini.\""}],"0.6.7":[{"t":"\"Ugh. That's Kano. Nobody likes Kano.\""}],"0.6.8":[{"t":"\"What? That's Asuka. She's a girl.\""}],"0.6.9":[{"t":">> done_guessing"}],"0.6.17":[{"t":"As you stand up, she looks up at you. \"Since you're getting up, can you find me the remote? I want to turn up the volume.\""},{"t":">> #living_room"}],"0.7":[{"t":"\"Okay. I hope you change your mind.\""},{"t":">> go_back"}],"0.12":[{"t":">> #living_room"}]},"remote":{"0":[{"t":"It's the remote for the television. Erin is looking for this."},{"t":"[Use]","k":"\\+"},{"t":"[Back]","k":"\\+"}],"0.1":[{"t":"if ($.bookmark === \"erin.remote\")","k":"~"},{"t":"else ","k":"~"}],"labels":{"gave":["remote","0.1.0",5]},"0.1.0":[{"t":"[:*!:]"},{"t":"[:& game.move(null, \"remote\"); :]"},{"t":"You hand the remote to Erin."},{"t":"\"Thanks, $:name!\""},{"t":"She points it at the TV and turns the volume up a couple notches. \"Ah. Much better.\""},{"t":"[Back]","k":"\\+","l":"remote.gave"}],"0.1.0.5":[{"t":">> #living_room"}],"0.1.1":[{"t":"You can't find a use for the remote here."},{"t":"[:& sadako.doLink(\"#inventory\") @: Back:] ~:choice"},{"t":"<< end"}],"0.2":[{"t":">> #inventory"}]},"story_data":{"depths":{"start.0.10":["start","0",11],"start.0.10.0":["start","0.10",1],"living_room.0.9":["living_room","0",10],"living_room.0.11":["living_room","0",12],"living_room.0.16":["living_room","0",18],"living_room.0.17":["living_room","0",18],"living_room.0.18":["living_room","0",19],"erin.0.3":["erin","0",5],"erin.0.4":["erin","0",5],"erin.0.6":["erin","0",8],"erin.0.7":["erin","0",8],"erin.0.6.2":["erin","0.6",4],"erin.0.6.3":["erin","0.6",4],"erin.0.6.6":["erin","0.6",10],"erin.0.6.7":["erin","0.6",10],"erin.0.6.8":["erin","0.6",10],"erin.0.6.9":["erin","0.6",10],"erin.0.6.14":["erin","0.6",16],"erin.0.6.15":["erin","0.6",16]},"version":"0.10.12"}};