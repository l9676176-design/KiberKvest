# Сборка и передача

Проект предназначен прежде всего для автономного запуска.

## Сборка в Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-offline.ps1
```

Результат:

- `dist/` — распакованная готовая версия;
- `downloads/KiberKvest-offline.zip` — архив для передачи пользователю.

Перед сборкой необходимо выполнить `npm test`. Публикация или отправка в GitHub выполняется только после разрешения владельца.
