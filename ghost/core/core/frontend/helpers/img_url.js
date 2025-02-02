// Usage:
// `{{img_url feature_image}}`
// `{{img_url profile_image absolute="true"}}`
// Note:
// `{{img_url}}` - does not work, argument is required
//
// Returns the URL for the current object scope i.e. If inside a post scope will return image permalink
// `absolute` flag outputs absolute URL, else URL is relative.
const { urlUtils } = require('../services/proxy');

const url = require('url');
const _ = require('lodash');
const logging = require('@tryghost/logging');
const tpl = require('@tryghost/tpl');
const imageTransform = require('@tryghost/image-transform');

const messages = {
  attrIsRequired: 'Attribute is required e.g. {{img_url feature_image}}',
};

const STATIC_IMAGE_URL_PREFIX = `${urlUtils.STATIC_IMAGE_URL_PREFIX}`;

module.exports = function imgUrl(requestedImageUrl, options) {
  // CASE: if no url is passed, e.g. `{{img_url}}` we show a warning
  if (arguments.length < 2) {
    logging.warn(tpl(messages.attrIsRequired));
    return;
  }

  // CASE: if url is passed, but it is undefined, then the attribute was
  // an unknown value, e.g. {{img_url feature_img}} and we also show a warning
  if (requestedImageUrl === undefined) {
    logging.warn(tpl(messages.attrIsRequired));
    return;
  }

  // CASE: if you pass e.g. cover_image, but it is not set, then requestedImageUrl is null!
  // in this case we don't show a warning
  if (requestedImageUrl === null) {
    return;
  }

  // CASE: if you pass an external image, there is nothing we want to do to it!
  const isInternalImage = detectInternalImage(requestedImageUrl);
  const sizeOptions = getImageSizeOptions(options);

  if (!isInternalImage) {
    // Detect Unsplash width and format
    const isUnsplashImage = /images\.unsplash\.com/.test(requestedImageUrl);
    if (isUnsplashImage) {
      try {
        return getUnsplashImage(requestedImageUrl, sizeOptions);
      } catch (e) {
        // ignore errors and just return the original URL
      }
    }

    return requestedImageUrl;
  }

  const absoluteUrlRequested = getAbsoluteOption(options);

  function applyImageSizes(image) {
    return getImageWithSize(image, sizeOptions);
  }

  function getImageUrl(image) {
    return urlUtils.urlFor('image', { image }, absoluteUrlRequested);
  }

  function ensureRelativePath(image) {
    return urlUtils.absoluteToRelative(image);
  }

  // CASE: only make paths relative if we didn't get a request for an absolute url
  const maybeEnsureRelativePath = !absoluteUrlRequested
    ? ensureRelativePath
    : _.identity;

  return maybeEnsureRelativePath(
    getImageUrl(applyImageSizes(requestedImageUrl))
  );
};

function getAbsoluteOption(options) {
  const absoluteOption = options && options.hash && options.hash.absolute;

  return absoluteOption
    ? !!absoluteOption && absoluteOption !== 'false'
    : false;
}

function getImageSizeOptions(options) {
  const requestedSize = options && options.hash && options.hash.size;
  const imageSizes =
    options &&
    options.data &&
    options.data.config &&
    options.data.config.image_sizes;
  const requestedFormat = options && options.hash && options.hash.format;

  return {
    requestedSize,
    imageSizes,
    requestedFormat,
  };
}

function detectInternalImage(requestedImageUrl) {
  const siteUrl = urlUtils.getSiteUrl();
  const isAbsoluteImage = /https?:\/\//.test(requestedImageUrl);
  const isAbsoluteInternalImage =
    isAbsoluteImage && requestedImageUrl.startsWith(siteUrl);

  // CASE: imagePath is a "protocol relative" url e.g. "//www.gravatar.com/ava..."
  //       by resolving the the imagePath relative to the blog url, we can then
  //       detect if the imagePath is external, or internal.
  const isRelativeInternalImage =
    !isAbsoluteImage &&
    url.resolve(siteUrl, requestedImageUrl).startsWith(siteUrl);

  return isAbsoluteInternalImage || isRelativeInternalImage;
}

function getUnsplashImage(imagePath, sizeOptions) {
  const parsedUrl = new URL(imagePath);
  const { requestedSize, imageSizes, requestedFormat } = sizeOptions;

  if (requestedFormat) {
    const supportedFormats = ['avif', 'gif', 'jpg', 'png', 'webp'];
    if (supportedFormats.includes(requestedFormat)) {
      parsedUrl.searchParams.set('fm', requestedFormat);
    } else if (requestedFormat === 'jpeg') {
      // Map to alias
      parsedUrl.searchParams.set('fm', 'jpg');
    }
  }

  if (!imageSizes || !imageSizes[requestedSize]) {
    return parsedUrl.toString();
  }

  const { width, height } = imageSizes[requestedSize];

  if (!width && !height) {
    return parsedUrl.toString();
  }

  parsedUrl.searchParams.delete('w');
  parsedUrl.searchParams.delete('h');

  if (width) {
    parsedUrl.searchParams.set('w', width);
  }
  if (height) {
    parsedUrl.searchParams.set('h', height);
  }
  return parsedUrl.toString();
}

/**
 *
 * @param {string} imagePath
 * @param {Object} sizeOptions
 * @param {string} sizeOptions.requestedSize
 * @param {Object[]} sizeOptions.imageSizes
 * @param {string} [sizeOptions.requestedFormat]
 * @returns
 */
function getImageWithSize(imagePath, sizeOptions) {
  const hasLeadingSlash = imagePath[0] === '/';

  if (hasLeadingSlash) {
    return '/' + getImageWithSize(imagePath.slice(1), sizeOptions);
  }
  const { requestedSize, imageSizes, requestedFormat } = sizeOptions;

  if (!requestedSize) {
    return imagePath;
  }

  if (!imageSizes || !imageSizes[requestedSize]) {
    return imagePath;
  }

  const { width, height } = imageSizes[requestedSize];

  if (!width && !height) {
    return imagePath;
  }

  const [imgBlogUrl, imageName] = imagePath.split(STATIC_IMAGE_URL_PREFIX);

  const sizeDirectoryName =
    prefixIfPresent('w', width) + prefixIfPresent('h', height);
  const formatPrefix =
    requestedFormat && imageTransform.canTransformToFormat(requestedFormat)
      ? `/format/${requestedFormat}`
      : '';

  return [
    imgBlogUrl,
    STATIC_IMAGE_URL_PREFIX,
    `/size/${sizeDirectoryName}`,
    formatPrefix,
    imageName,
  ].join('');
}

function prefixIfPresent(prefix, string) {
  return string ? prefix + string : '';
}
