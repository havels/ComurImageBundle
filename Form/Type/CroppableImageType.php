<?php

namespace Comur\ImageBundle\Form\Type;

use Closure;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormView;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\OptionsResolver\Options;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class CroppableImageType extends AbstractType
{
    protected bool $isGallery = false;

    protected ?string $galleryDir = null;
    protected ?string $thumbsDir = null;

    protected static array $uploadConfig = [
        'uploadRoute' => 'comur_api_upload',
        'uploadDir' => null,
        'webDir' => null,
        'fileExt' => '*.jpg;*.gif;*.png;*.jpeg',
        'maxFileSize' => 50,
        'libraryDir' => null,
        'libraryRoute' => 'comur_api_image_library',
        'showLibrary' => true,
        'saveOriginal' => false, //save original file name
        'generateFilename' => true //generate an uniq filename
    ];

    protected static array $cropConfig = [
        'minWidth' => 1,
        'minHeight' => 1,
        'aspectRatio' => true,
        'cropRoute' => 'comur_api_crop',
        'forceResize' => false,
        'thumbs' => null,
        'disable' => false
    ];

    public function getBlockPrefix(): string
    {
        return 'comur_image';
    }

    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        if ($options['uploadConfig']['saveOriginal']) {
            $builder->add($options['uploadConfig']['saveOriginal'], TextType::class, [
                'attr' => ['style' => 'opacity: 0;width: 0; max-width: 0; height: 0; max-height: 0;']]);
        }
        $builder->add($builder->getName(), TextType::class, [
            'attr' => ['style' => 'opacity: 0;width: 0; max-width: 0; height: 0; max-height: 0;']]);
    }

    /**
     * Returns upload config normalizer. It can be used by compatible bundles to normalize parameters
     * @param array $uploadConfig
     * @param bool $isGallery
     * @param string|null $galleryDir
     * @return Closure
     */
    public static function getUploadConfigNormalizer(array $uploadConfig, bool $isGallery = false, ?string $galleryDir = null): Closure
    {
        return static function (Options $options, $value) use ($uploadConfig, $isGallery, $galleryDir) {
            $config = array_merge($uploadConfig, $value);

            if ($isGallery) {
                $config['uploadDir'] .= '/' . $galleryDir;
                $config['webDir'] .= '/' . $galleryDir;
                $config['saveOriginal'] = false;
            }

            if (!isset($config['libraryDir'])) {
                $config['libraryDir'] = $config['uploadDir'];
            }

            return $config;
        };
    }

    /**
     * Returns crop config normalizer. It can be used by compatible bundles to normalize parameters
     * @param array $cropConfig
     * @return Closure
     */
    public static function getCropConfigNormalizer(array $cropConfig): Closure
    {
        return static function (Options $options, $value) use ($cropConfig) {
            return array_merge($cropConfig, $value);
        };
    }

    /**
     * {@inheritDoc}
     */
    public function configureOptions(OptionsResolver $resolver): void
    {
        $uploadConfig = self::$uploadConfig;
        $cropConfig = self::$cropConfig;

        $resolver->setDefaults([
            'uploadConfig' => $uploadConfig,
            'cropConfig' => $cropConfig,
            'inherit_data' => true,
        ]);

        $isGallery = $this->isGallery;
        $galleryDir = $this->galleryDir;

        $resolver->setNormalizer(
            'uploadConfig', self::getUploadConfigNormalizer($uploadConfig, $isGallery, $galleryDir)
        );
        $resolver->setNormalizer(
            'cropConfig', self::getCropConfigNormalizer($cropConfig)
        );
    }

    /**
     * {@inheritdoc}
     */
    public function buildView(FormView $view, FormInterface $form, array $options): void
    {
        $uploadConfig = $options['uploadConfig'];
        $cropConfig = $options['cropConfig'];

        $fieldImage = null;
        if (isset($cropConfig['thumbs']) && count($thumbs = $cropConfig['thumbs']) > 0) {
            foreach ($thumbs as $thumb) {
                if (isset($thumb['useAsFieldImage']) && $thumb['useAsFieldImage']) {
                    $fieldImage = $thumb;
                }
            }
        }

        $view->vars['options'] = [
            'uploadConfig' => $uploadConfig,
            'cropConfig' => $cropConfig,
            'fieldImage' => $fieldImage,
        ];
        $view->vars['attr'] = array_merge($options['attr'] ?? [], [
                'style' => 'opacity: 0;width: 0; max-width: 0; height: 0; max-height: 0;',
            ]
        );
    }
}
