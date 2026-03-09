# Bracketsball Original Vision

This is an app for users to compete in March Madness Bracket Challenges. There isn’t anything groundbreaking about the app. It is just suppose to be a fun app for friends to compete with each other to see who is the best at predicting NCAA basketball games in the NCAA Tournament.

The app will support “pools” where friends can create bracket entries with all of their picks. Correctly picking each game will earn the user points. The deeper into the tournament, the more the pick is worth. In the event of a tie, users will also be entering the total score of the national championship game and whoever is closer to the total will win the tiebreaker.

March Madness starts in under 2 weeks, so I’m looking to keep the scope of the project very limited to just the essentials.

## Features

| Feature Title       | Description                                                                                                                                                                                                                                                                                                                                                          | Epic    | MVP? |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---- |
| Social Login        | Users can create accounts/login with Google and Discord. Name and username and profile pic are automatically generated on signup.                                                                                                                                                                                                                                    | Auth    | Yes  |
| Profile Management  | Users can edit their username, name and profile pic url. Username must be unique.                                                                                                                                                                                                                                                                                    | Profile | Yes  |
| Account Management  | Users can delete their account. Once deleted, it cannot be recovered. Any user activity is anonymized                                                                                                                                                                                                                                                                | Account | Yes  |
| Create Bracket Pool | A user can create a bracket pool by specifying a name and optionally an image url. The user must also specify the max brackets per user, which defaults to 5 and can go up to 10, as well as max participants, which defaults to 50 and goes up to 100. All additional settings can be customized after creation and are filled with defaults upon bracket creation. |

Scoring Settings by default without any configuration are as follows for correct picks

First Four: 0 points
Round of 64: 1 point
Round of 32: 2 points
Sweet 16: 4 points
Elite 8: 8 points
Final Four: 16 points
Championship: 32 points

If there is enough time, I’d like to be able to add the ability to toggle pools to be private (invite only) and public (anyone can search and join). This is a non-critical feature for MVP, but we should factor it into technical design.

Creators of Pools are leaders of the pool. | Pools Setup | Yes |
| Public Pool Search | Pools can be searched by name as well as filtered by attributes like a range of brackets per entry and pool size. Only pools with availability in capacity can be joined. | Public Pools | No |
| Bracket Pool Public Setting | If there is enough time, I’d like to be able to add the ability to toggle pools to be private (invite only) and public (anyone can search and join). This is a non-critical feature for MVP, but we should factor it into technical design.

This would apply to creation and editing of pools. | Public Pools | No |
| Bracket Pool Members Invites | Bracket Pool Members can be invited via a sharable invite link. Invite links have an expiration (defaults to 7 days), max uses (defaults to available pool size), as well as a role (member, leader). | Pool Members | Yes |
| Bracket Pool Members In-app Invites | In addition to links, invites can be sent to existing users by searching for the user. | Pool Members | No |
| Manage Bracket Pool Settings | All of the settings available in bracket pool creation can also be edited here up until the games start. One exception is that max bracket size can’t go below the amount of the largest bracket count per user to that point, and max participants can’t go below the current amount of people in the pool. Only pool leaders can edit these. | Pool Settings | Yes |
| Manage Bracket Scoring Settings | Scoring Settings can be edited where points per round can be tweaked. Only Pool leaders can edit these. | Pool Settings | No |
| Creating a bracket entry | Pool Entries can be created for a member (as long as they havn’t created the max amount).

Pool entries have names to help users distinguish them from one another.

Because there are so many games to pick, the form/ui for creating the game should auto save each game picked. Only brackets where all the games are picked can be submitted. | Bracket Creation | Yes |
| Editing a bracket entries | Bracket entries can be edited up until the tournament games start. All the same functionality available when creating a bracket should be available for editing. | Bracket Creation | Yes |
| Viewing Own Brackets | A user can view a list of their own brackets. This includes points accumulated so far as well as future points available. Individual brackets can be viewed for more detail. | Bracket Visibility | Yes |
| Viewing other member brackets | A user can view a list of other members brackets. This includes points accumulated so far as well as future points available. | Bracket Visibility | Yes |
| Viewing standings | A user can view a list of their own brackets and other brackets. This includes points accumulated so far as well as future points available. Individual brackets can be viewed for more detail.

Brackets are ordered by points, then potential points available, then alphabetical. | Bracket Visibility | Yes |
| View individual bracket. | A user can view individual brackets, its games, and the details of the games, as well as indicators about the success status of the pick. | Bracket Visibility | Yes |
| Sports Data Sync | The following sports data will need to be synced to the app

- Bracket Games
- Bracket Game Teams
- Bracket Game Scoring info (score of each team, period, time left, game status)
- Bracket Game Date and Time
- Game location (city, state)

Ideally, we can use https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b to start out | Sports Data | Yes |
