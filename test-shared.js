// Test file for shared page functionality
function testSharedPage() {
  const message = "This is a test file for the shared page functionality";
  console.log(message);
  
  // Test different language syntax highlighting
  const languages = {
    javascript: 'const greeting = "Hello World!";',
    typescript: 'const greeting: string = "Hello World!";',
    python: 'greeting = "Hello World!"',
    css: '.greeting { color: blue; }',
    html: '<div class="greeting">Hello World!</div>',
    json: '{ "greeting": "Hello World!" }'
  };
  
  return languages;
}

export default testSharedPage;
