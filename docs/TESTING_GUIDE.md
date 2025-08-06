# Guía de Pruebas - Guiñote Multijugador

## Cómo probar el juego con amigos

### Opción 1: Probar con dispositivos reales (Recomendado)
1. **Instala la app** en 2-4 dispositivos iOS
2. **Crea una cuenta** en cada dispositivo usando Clerk
3. **Crea una sala**:
   - En el dispositivo 1: Ve a "Jugar" → "Online" → "Salas" → "Crear Nueva Sala"
   - Anota el código de sala (ej: 3PRNWL)
4. **Únete a la sala**:
   - En los otros dispositivos: Ve a "Jugar" → "Online" → "Salas"
   - Busca la sala con el código o úsalo para unirte
5. **Empieza la partida** cuando todos estén listos

### Opción 2: Probar con simuladores iOS
1. **Abre múltiples simuladores**:
   ```bash
   # Terminal 1
   npx react-native run-ios --simulator="iPhone 14"
   
   # Terminal 2
   npx react-native run-ios --simulator="iPhone 14 Pro"
   
   # Terminal 3 (opcional)
   npx react-native run-ios --simulator="iPhone 13"
   ```
2. **Crea cuentas diferentes** en cada simulador
3. **Sigue los pasos** de la Opción 1

### Opción 3: Combinar jugadores reales con IA
1. **Crea una sala** con tu dispositivo
2. **Añade jugadores IA**:
   - Toca el botón "➕ Añadir IA"
   - Puedes añadir hasta 3 jugadores IA
3. **Configura la dificultad** de cada IA si lo deseas
4. **Empieza la partida**

## Compartir código de sala

### Después de las correcciones:
1. **Reinicia la app** después de los cambios en Info.plist
2. **Toca "Compartir por WhatsApp"**:
   - Se abrirá el selector de apps nativo de iOS
   - Selecciona WhatsApp o cualquier otra app
   - El mensaje incluirá el código de sala

### Si el botón no funciona:
1. **Comparte manualmente** el código de sala
2. **Los amigos pueden**:
   - Abrir la app
   - Ir a "Jugar" → "Online" → "Salas"
   - Introducir el código manualmente

## Notas importantes

- **Conexión a internet**: Todos los jugadores necesitan conexión estable
- **Cuenta de Clerk**: Cada jugador necesita su propia cuenta
- **Mínimo 2 jugadores**: Puedes completar con IA si no tienes 4 personas
- **Teams**: Los jugadores se organizan automáticamente en equipos (1-3 vs 2-4)

## Solución de problemas

### "No se puede compartir"
- Reinicia la app después de los cambios
- Asegúrate de tener WhatsApp instalado
- Usa el selector de apps nativo como alternativa

### "No se encuentra la sala"
- Verifica que el código sea correcto
- Asegúrate de que la sala esté en estado "Esperando"
- El host no debe haber salido de la sala

### "Error de conexión"
- Verifica tu conexión a internet
- Asegúrate de estar autenticado en Clerk
- Intenta crear una nueva sala