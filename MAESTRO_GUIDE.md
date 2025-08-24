# Maestro Testing Guide for Guinote2

## ✅ Installation Complete

Maestro is now installed and configured for your project!

## 📁 Project Structure

```
guinote2/
├── maestro/
│   ├── config.yaml           # Global configuration
│   └── flows/
│       ├── 01-offline-mode.yaml
│       ├── 02-navigation.yaml
│       └── 03-quick-match.yaml
```

## 🚀 Running Tests

### Prerequisites

1. **Build the app first**:

   ```bash
   npx react-native run-ios --simulator="iPhone 16 Pro"
   ```

2. **Set Java environment** (add to ~/.zshrc):
   ```bash
   export JAVA_HOME="/usr/local/Cellar/openjdk/24.0.2/libexec/openjdk.jdk/Contents/Home"
   export PATH="$JAVA_HOME/bin:$PATH:$HOME/.maestro/bin"
   ```

### Run Tests

```bash
# Run single test
maestro test maestro/flows/01-offline-mode.yaml

# Run all tests
maestro test maestro/flows/

# Interactive mode (record your actions!)
maestro studio
```

## 📝 Writing New Tests

### Basic Test Structure

```yaml
appId: com.guinote2
---
- launchApp
- tapOn: 'Button Text'
- assertVisible: 'Expected Text'
```

### Game-Specific Actions

```yaml
# Tap a card in hand
- tapOn:
    point: '50%, 85%' # Bottom center

# Wait for AI turn
- waitForAnimationToEnd

# Swipe to see more cards
- swipeLeft:
    start: '80%, 85%'
    end: '20%, 85%'
```

## 🎮 Test Scenarios Created

### 1. Offline Mode (`01-offline-mode.yaml`)

- Launches app
- Navigates to offline mode
- Starts new game
- Plays a card
- Returns to menu

### 2. Navigation (`02-navigation.yaml`)

- Tests bottom navigation
- Verifies all main screens
- Checks tab switching

### 3. Quick Match (`03-quick-match.yaml`)

- Attempts quick match
- Handles login flow
- Tests cancellation

## 🔍 Debugging

### View what Maestro sees

```bash
maestro studio
```

### Take screenshots during test

```yaml
- takeScreenshot: 'game-started'
```

### Add delays if needed

```yaml
- waitForAnimationToEnd
- wait:
    timeout: 3000 # 3 seconds
```

## 🎯 Best Practices for Card Games

1. **Use coordinates for cards**:

   ```yaml
   # Cards are usually in bottom 20% of screen
   - tapOn:
       point: '30%, 85%' # First card
   - tapOn:
       point: '50%, 85%' # Middle card
   - tapOn:
       point: '70%, 85%' # Third card
   ```

2. **Wait for animations**:

   ```yaml
   - waitForAnimationToEnd
   - assertVisible: 'Tu turno'
   ```

3. **Handle AI turns**:
   ```yaml
   - assertVisible: 'IA jugando...'
   - waitForAnimationToEnd
   ```

## 🆚 Maestro vs Detox

| Feature         | Maestro      | Detox      |
| --------------- | ------------ | ---------- |
| Setup Time      | 5 minutes    | 2+ hours   |
| Language        | YAML         | JavaScript |
| Learning Curve  | Easy         | Complex    |
| Build Required  | No           | Yes        |
| Visual Feedback | Yes (Studio) | No         |
| Speed           | Fast         | Slow       |

## 🚨 Common Issues

### "App not found"

```bash
# Build and install first
npx react-native run-ios
```

### "Java not found"

```bash
# Add to ~/.zshrc
export JAVA_HOME="/usr/local/Cellar/openjdk/24.0.2/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

### Test fails intermittently

- Add `waitForAnimationToEnd` between actions
- Use `assertVisible` with longer timeouts
- Consider network delays

## 📚 Resources

- [Maestro Docs](https://maestro.mobile.dev)
- [YAML Reference](https://maestro.mobile.dev/reference/commands)
- [Best Practices](https://maestro.mobile.dev/best-practices)

## 🎉 Next Steps

1. Run `maestro studio` to explore your app interactively
2. Create more test flows in `maestro/flows/`
3. Add to CI/CD pipeline with `maestro cloud`
