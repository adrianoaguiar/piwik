<?php
class Test_Piwik_JsProxy extends PHPUnit_Framework_TestCase
{
    /**
     * @group Core
     * @group JsProxy
     */
    function testPiwikJs()
    {
        $curlHandle = curl_init();
        curl_setopt($curlHandle, CURLOPT_URL, $this->getStaticSrvUrl() . '/js/');
        curl_setopt($curlHandle, CURLOPT_RETURNTRANSFER, true);
        $fullResponse = curl_exec($curlHandle);
        $responseInfo = curl_getinfo($curlHandle);
        curl_close($curlHandle);

        $this->assertEquals($responseInfo["http_code"], 200, 'Ok response');

        $piwik_js = file_get_contents(PIWIK_PATH_TEST_TO_ROOT . '/piwik.js');
        $this->assertEquals($fullResponse, $piwik_js, 'script content');
    }

    /**
     * @group Core
     * @group JsProxy
     */
    function testPiwikPhp()
    {
        $curlHandle = curl_init();
        $url        = $this->getStaticSrvUrl() . '/js/?idsite=1';
        curl_setopt($curlHandle, CURLOPT_URL, $url);
        curl_setopt($curlHandle, CURLOPT_RETURNTRANSFER, true);
        $fullResponse = curl_exec($curlHandle);
        $responseInfo = curl_getinfo($curlHandle);
        curl_close($curlHandle);

        $this->assertEquals($responseInfo["http_code"], 200, 'Ok response');
        $ok = $fullResponse == base64_decode("R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==");
        $this->assertTrue($ok, 'image content');
    }

    /**
     * Helper methods
     */
    private function getStaticSrvUrl()
    {
        $path = Piwik_Url::getCurrentScriptPath();
        if (substr($path, -7) == '/tests/') {
            $path = substr($path, 0, -7);
        } else {
            if (substr($path, -18) == '/tests/core/Piwik/') {
                $path = substr($path, 0, -18);
            } else {
                throw new Exception('unsupported test path: ' . $path);
            }
        }

        return "http://" . $_SERVER['HTTP_HOST'] . $path;
    }
}
