# Boilerplate Web File Manager

## FilePond Spike - Sistema de Gestión de Archivos
Un boilerplate completo para aplicaciones web que necesiten un sistema de manejo de archivos.

## Características Principales
- **Auto-Upload**: Los archivos se guardan automáticamente al subirlos.
- **Actualización en tiempo real de la UI**: La interfaz se actualiza inmediatamente ante cualquier cambio en los archivos.
- **Verificación de tipo y tamaño de archivos**: No se permite subir archivos cuyo tipo o tamaño esté prohibido.
- **Visualización de archivos**: Los archivos subidos pueden visualizarse haciendo clic directamente en su tarjeta.

## Instalación
```bash
npm install
````

## Configuración de FilePond

```javascript
const pond = FilePond.create(document.querySelector('.filepond'), {
    allowMultiple: true,
    maxFiles: 3,
    allowFileTypeValidation: true,
    acceptedFileTypes: ['image/*', ...viewableTypes],
    allowFileSizeValidation: true,
    maxFileSize: '10MB',
    minFileSize: '1KB',

    // Callbacks para agregar eventos cuando los archivos se procesan
    onaddfile: (error, file) => {
        if (!error) {
            setTimeout(addClickEvents, 100);
        }
    },
    
    onprocessfile: (error, file) => {
        if (!error) {
            setTimeout(addClickEvents, 100);
        }
    },

    server: {
        process: {
            url: '/api/upload',
            method: 'POST',
            onload: (response) => {
                const file = JSON.parse(response);
                return file.id;
            }
        },
        revert: (uniqueFileId, load, error) => {
            fetch(`/api/upload/${uniqueFileId}`, { method: 'DELETE' })
                .then(() => load())
                .catch(() => error('Error al eliminar el archivo'));
        },
        remove: (uniqueFileId, load, error) => {
            fetch(`/api/upload/${uniqueFileId}`, { method: 'DELETE' })
                .then(() => load())
                .catch(() => error('Error al eliminar el archivo'));
        },
        load: async (uniqueFileId, load, error) => {
            try {
                const res = await fetch(`/uploads/${uniqueFileId}`);
                if (!res.ok) throw new Error('Archivo no encontrado');
                const blob = await res.blob();
                const file = new File([blob], uniqueFileId, { type: blob.type });
                load(file);
            } catch (err) {
                error('Error al cargar el archivo');
            }
        }
    },
});
```

## Configuración

Se simuló una base de datos con el archivo `files.json`, que guarda la metadata de los archivos. Esto permite que FilePond cargue primero la metadata y luego los archivos correspondientes.

## API Endpoints

* `GET /api/view/:id` - Envía un archivo al navegador.
* `DELETE /api/upload/:id` - Elimina el archivo con el ID indicado.
* `GET /api/files` - Devuelve la metadata para la interfaz de FilePond.
* `GET /uploads/:id` - Devuelve un archivo específico según su ID para FilePond.