<?php
namespace Comur\ImageBundle\Twig;

use Twig\Extension\AbstractExtension;
use Twig\Extension\GlobalsInterface;
use Twig\TwigFilter;

class ThumbExtension extends AbstractExtension implements GlobalsInterface
{
    protected string $croppedDir;
    protected string $thumbsDir;
    protected string $galleryDir;
    protected string $webDir;
    protected string $transDomain;

    public function __construct(string $croppedDir, string $thumbsDir, string $webDir, string $transDomain, string $galleryDir)
    {
        $this->croppedDir = $croppedDir;
        $this->thumbsDir = $thumbsDir;
        $this->transDomain = $transDomain;
        $this->webDir = $webDir;
        $this->galleryDir = $galleryDir;
    }

    public function getFilters(): array
    {
        return [
            new TwigFilter('thumb', [$this, 'getThumb']),
            new TwigFilter('gallery_thumb', [$this, 'getGalleryThumb']),
        ];
    }

    /**
     * Returns thumb file if exists
     * @param string $origFilePath web path to original file (relative, ex: uploads/members/cropped/az4da1s.jpg)
     * @param integer $width desired thumb's width
     * @param integer $height desired thumb's height
     * @return string thumbnail path if thumbnail exists, if not returns original file path
     */
    public function getThumb(string $origFilePath, int $width, int $height): string
    {
        $pathInfo = pathinfo($origFilePath);
        if(isset($pathInfo['dirname'], $pathInfo['basename']))
        {
            $uploadDir = $pathInfo['dirname'] . '/';
            $filename = $pathInfo['basename'];

            return $uploadDir . $this->thumbsDir . '/' . $width . 'x' . $height . '-' .$filename;
        }

        return $origFilePath;
    }

    public function getGalleryThumb(string $origFilePath, int $width, int $height): string
    {
        return $this->getThumb($this->galleryDir . '/' . $origFilePath, $width, $height);
    }

    public function getGlobals(): array
    {
        return array('comur_translation_domain' => $this->transDomain);
    }
}
