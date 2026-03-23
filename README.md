# Focus Flow

Build structured focus sessions and just execute them.
No decisions, no multitasking — just work.

## How it works
- Build workflows — ordered sequences of timed tasks
- Or just prompt the AI and it builds it for you


## Features
- ⏱️ Customizable timers - Create tasks with specific durations
- ⚡ Workflow engine — nested, loopable, recursive
- 🤖 AI agent — not a just chatbot, actually does things
- 🔁 DAG cycle detection (DFS)
- 📎 File reading — supports PDF,DOCX,TXT,MD,CSV,HTML
- ⏰ Extension windows - percentage-based window to extend tasks on the run
- 📅 Calendar integration - Schedule tasks and workflows

## Demo
[Live Demo](focus-flow-production-a922.up.railway.app)

## Getting Started
### Prerequisites
- Node.js ( Node.js 20 or higher)
- npm or yarn
### Installation
bash
# Clone the repo
git clone https://github.com/GettingGud57/Focus-Flow.git
# Install dependencies
npm install
# Run locally
npx vite

## Tech Stack
TypeScript, React 19, TanStack Query, 
Drizzle ORM, Zod, shadcn/ui, Tailwind, Groq

## Usage
1. Create a task with a description and duration
2. Start the timer
3. When time's up, choose to extend or finish
4. Combine tasks into workflows for repeated sequences


## Future Improvements
- [ ] Mobile app (React Native conversion in progress)
- [ ] Data persistence
- [ ] User accounts
- [ ] Analytics/statistics


## License
MIT

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
