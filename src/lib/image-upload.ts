import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Utilitário para redimensionar, comprimir e gerar Blob / DataURL de imagem.
 */
function compressImageToBlob(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Selecione um arquivo de imagem válido (JPG, PNG, WEBP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler a imagem do seu dispositivo.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem não suportado. Tente outra foto.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const fallbackDataUrl = e.target?.result as string;
          resolve({
            blob: file,
            dataUrl: fallbackDataUrl
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl: compressedDataUrl });
            } else {
              resolve({ blob: file, dataUrl: compressedDataUrl });
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime a imagem e faz upload real para o Firebase Storage.
 * Retorna a download URL (https://firebasestorage.googleapis.com/...) para evitar
 * o limite de 1 MiB de documento do Firestore.
 * 
 * Se o Firebase Storage falhar ou estiver offline, faz fallback seguro para data URL comprimida (base64)
 * registrando aviso no console.
 */
export async function uploadImageToStorage(
  file: File,
  pasta: 'banners' | 'carrossel' | 'organizadores' | 'geral' = 'geral',
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  const { blob, dataUrl } = await compressImageToBlob(file, maxWidth, maxHeight, quality);

  try {
    if (!storage) {
      throw new Error('Firebase Storage não inicializado.');
    }

    const extensao = 'jpg';
    const nomeArquivo = `${pasta}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extensao}`;
    const storageRef = ref(storage, nomeArquivo);

    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000'
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn(
      '⚠️ Firebase Storage indisponível ou inacessível. Usando base64 comprimido como fallback:',
      error
    );
    return dataUrl;
  }
}

/**
 * Função unificada mantida para compatibilidade direta com chamadas existentes.
 */
export async function compressAndReadImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return uploadImageToStorage(file, 'geral', maxWidth, maxHeight, quality);
}
