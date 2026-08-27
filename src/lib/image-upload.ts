/// <reference types="vite/client" />

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
 * Comprime a imagem e faz upload real para o Cloudinary (unsigned upload).
 * Retorna a secure_url para evitar o limite de 1 MiB de documento do Firestore.
 * 
 * Se o Cloudinary falhar ou não estiver configurado, faz fallback seguro para data URL comprimida (base64)
 * registrando aviso no console.
 */
export async function uploadImageToStorage(
  file: File,
  pasta: 'banners' | 'carrossel' | 'organizadores' | 'geral' | 'logoscabecalho' = 'geral',
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  const { blob, dataUrl } = await compressImageToBlob(file, maxWidth, maxHeight, quality);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.warn(
      '⚠️ VITE_CLOUDINARY_CLOUD_NAME ou VITE_CLOUDINARY_UPLOAD_PRESET não configurados. Usando base64 comprimido como fallback.'
    );
    return dataUrl;
  }

  try {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', `rifazone/${pasta}`);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Cloudinary upload failed: ${res.statusText} - ${errorText}`);
    }

    const data = await res.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error('secure_url não retornado pelo Cloudinary');
    }
  } catch (error) {
    console.warn(
      '⚠️ Cloudinary upload falhou. Usando base64 comprimido como fallback:',
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
