// Test file for Monaco Editor integration
const testMessage = "Hello from Monaco Editor!";

function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet("World"));
console.log(testMessage);

export { greet, testMessage };
